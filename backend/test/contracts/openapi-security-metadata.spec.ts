import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

const authGuards = new Set([
  'JwtAuthGuard',
  'AuthSurfaceGuard',
  'RolesGuard',
  'AdminPermissionGuard',
]);

const decorators = (node: ts.Node) =>
  ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];

const decoratorName = (decorator: ts.Decorator) => {
  const expression = decorator.expression;
  return ts.isCallExpression(expression)
    ? expression.expression.getText()
    : expression.getText();
};

const hasDecorator = (items: readonly ts.Decorator[], name: string) =>
  items.some((decorator) => decoratorName(decorator) === name);

const isProtectedWithoutBearer = (
  method: ts.MethodDeclaration,
  classDecorators: readonly ts.Decorator[],
) => {
  const methodDecorators = decorators(method);
  const useGuards = methodDecorators.find(
    (decorator) => decoratorName(decorator) === 'UseGuards',
  );
  const guards = useGuards?.expression.getText() ?? '';

  return (
    [...authGuards].some((guard) => guards.includes(guard)) &&
    ![...classDecorators, ...methodDecorators].some(
      (decorator) => decoratorName(decorator) === 'ApiBearerAuth',
    )
  );
};

const missingBearerMethods = (filename: string, root: string) => {
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  return source.statements
    .filter(ts.isClassDeclaration)
    .flatMap((declaration) => {
      const classDecorators = decorators(declaration);
      return declaration.members
        .filter(ts.isMethodDeclaration)
        .filter((method) => isProtectedWithoutBearer(method, classDecorators))
        .map((method) => `${path.relative(root, filename)}:${method.name?.getText()}`);
    });
};

const findMissingBearerMethods = (directory: string, root = directory): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return findMissingBearerMethods(filename, root);
    return filename.endsWith('.controller.ts')
      ? missingBearerMethods(filename, root)
      : [];
  });

describe('OpenAPI bearer security metadata', () => {
  it('documents every controller method protected by the application auth guards', () => {
    const root = path.resolve(process.cwd(), 'src');
    expect(findMissingBearerMethods(root)).toEqual([]);
  });

  it('keeps Public wallet activity filters optional in the generated contract', () => {
    const artifact = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), '../docs/contracts/openapi.json'),
        'utf8',
      ),
    );
    const parameters = artifact.paths['/wallet/activity'].get.parameters;
    expect(parameters.map((parameter: { name: string }) => parameter.name)).toEqual([
      'limit',
      'cursor',
      'type',
      'asset',
      'status',
    ]);
    expect(parameters.every((parameter: { required: boolean }) => !parameter.required)).toBe(true);
    expect(parameters[0].schema).toMatchObject({ minimum: 1, maximum: 100 });
    expect(artifact.paths['/wallet/activity'].get.responses['200'].content['application/json'].schema.$ref)
      .toBe('#/components/schemas/WalletActivityResponseDto');
  });

  it('documents disabled legacy wallet routes as Gone without false success responses', () => {
    const artifact = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'),
    );
    const operations = [
      ['post', '/wallet/deposit'], ['post', '/wallet/withdraw'],
      ['post', '/wallet/admin/credit'], ['post', '/wallet/admin/debit'],
      ['get', '/wallet/admin/withdrawals'], ['post', '/wallet/admin/withdrawals/approve'],
      ['post', '/wallet/admin/withdrawals/reject'],
    ] as const;
    for (const [method, route] of operations) {
      const responses = artifact.paths[route][method].responses;
      expect(Object.keys(responses)).toEqual(['410']);
      expect(responses['410'].description).toContain('disabled');
    }
  });

  it('documents disabled legacy conversion routes as Gone without false success responses', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    const operations = [
      ['get', '/conversion/rate'], ['post', '/conversion/convert'], ['post', '/conversion/admin/rate'],
    ] as const;
    for (const [method, route] of operations) {
      const responses = artifact.paths[route][method].responses;
      expect(Object.keys(responses)).toEqual(['410']);
      expect(responses['410'].description).toContain('disabled');
    }
  });

  it('documents the unavailable legacy market proxy without a false success response', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    const responses = artifact.paths['/market/proxy'].get.responses;
    expect(Object.keys(responses)).toEqual(['503']);
    expect(responses['503'].description).toContain('unavailable');
  });

  it('documents the persisted read receipt returned by Public and Admin mark-read actions', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    const schema = '#/components/schemas/MessageReadResponseDto';
    for (const route of ['/communications/messages/{id}/read', '/communications/admin/messages/{id}/read']) {
      const responses = artifact.paths[route].post.responses;
      expect(responses['201'].content['application/json'].schema.$ref).toBe(schema);
      expect(responses['404'].description).toMatch(/not found/i);
    }
    expect(artifact.components.schemas.MessageReadResponseDto).toMatchObject({
      required: ['id', 'conversationId', 'senderId', 'recipientId', 'body', 'deliveryState', 'sequence', 'readAt', 'attachments', 'createdAt'],
      properties: {
        conversationId: { nullable: true },
        readAt: { format: 'date-time', nullable: true },
        attachments: { nullable: true },
      },
    });
  });

  it('documents Public profile, Binary configuration, and market asset response schemas', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    const profile = artifact.paths['/auth/me'].patch.responses['200'].content['application/json'].schema;
    expect(profile.required).toContain('referral');
    expect(profile.properties.vip.nullable).toBe(true);
    const binary = artifact.paths['/binary/config'].get.responses['200'].content['application/json'].schema;
    expect(binary.properties.configurations.items.required).toContain('durationSeconds');
    const asset = artifact.paths['/market/assets/{symbol}'].get.responses['200'].content['application/json'].schema;
    expect(asset.properties.details.additionalProperties).toBe(true);
    expect(asset.properties.details.required).toContain('provenance');
  });

  it('documents response bodies consumed by Admin trading controls', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    const responseSchema = (route: string, method: string, status: string) =>
      artifact.paths[route][method].responses[status].content['application/json'].schema;

    expect(responseSchema('/admin/spot/margin/config', 'get', '200')).toMatchObject({
      type: 'object',
      required: ['maintenanceRatio', 'leverages'],
      properties: {
        maintenanceRatio: { type: 'number' },
        leverages: { type: 'array', items: { type: 'number' } },
      },
    });
    expect(responseSchema('/admin/spot/margin/config', 'post', '201')).toMatchObject({
      type: 'object',
      required: ['maintenanceRatio', 'leverages'],
    });
    expect(responseSchema('/admin/spot/orders/{id}/cancel', 'post', '201')).toMatchObject({
      type: 'object',
      required: ['ok', 'auditId', 'state'],
    });
    for (const route of ['/admin/spot/pairs/maintenance', '/admin/binary/pairs/maintenance']) {
      expect(responseSchema(route, 'post', '201')).toMatchObject({
        type: 'object',
        required: ['ok', 'auditId', 'status'],
      });
    }
  });
});
