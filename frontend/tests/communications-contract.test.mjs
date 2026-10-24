import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const page = readFileSync(new URL('../app/dashboard/messages/page.tsx', import.meta.url), 'utf8');
const openapi = JSON.parse(readFileSync(new URL('../../docs/contracts/openapi.json', import.meta.url), 'utf8'));
assert.match(page, /api\.get<unknown>\('\/communications\/support\/thread'/);
assert.match(page, /api\.post<unknown>\('\/communications\/support\/attachments'/);
assert.match(page, /api\.post\('\/communications\/support\/messages'/);
assert.match(page, /idempotencyKey/);
const requiredOperations = [
  ['/communications/support/thread', 'get'],
  ['/communications/support/messages', 'post'],
  ['/communications/support/attachments', 'post'],
  ['/communications/support/attachments/{id}', 'get'],
  ['/communications/admin/messages', 'get'],
  ['/admin/messages', 'post'],
  ['/admin/messages/{recipientId}/attachments', 'post'],
  ['/admin/messages/{recipientId}/attachments/{id}', 'get'],
  ['/public/config/support', 'get'],
];
const contractIssues = [];
for (const [route, method] of requiredOperations) {
  if (!openapi.paths?.[route]?.[method]) contractIssues.push(`missing OpenAPI operation: ${method.toUpperCase()} ${route}`);
}

for (const route of [
  '/communications/tickets',
  '/communications/tickets/{id}/replies',
  '/communications/tickets/{id}/assign',
  '/admin/tickets',
  '/admin/tickets/{id}/reply',
  '/admin/tickets/{id}/status',
]) {
  if (openapi.paths?.[route]) contractIssues.push(`retired ticket route is still documented: ${route}`);
}

const recipientSelectedSend = openapi.paths?.['/communications/messages']?.post;
if (recipientSelectedSend) {
  const responseCodes = Object.keys(recipientSelectedSend.responses ?? {});
  if (!responseCodes.includes('410')) contractIssues.push('retired recipient-selected send does not document HTTP 410');
  if (responseCodes.some((status) => /^2\d\d$/.test(status))) contractIssues.push('recipient-selected send advertises a successful response');
}
assert.deepEqual(contractIssues, [], 'OpenAPI communications contract is stale');

for (const route of ['/communications/conversations', '/communications/conversations/{id}/report', '/communications/announcements', '/communications/learn', '/communications/learn/{slug}', '/communications/notifications', '/communications/notifications/{id}/read']) {
  assert.ok(openapi.paths?.[route], `missing OpenAPI path: ${route}`);
}

const schemas = openapi.components?.schemas ?? {};
const supportRequest = schemas.SendSupportMessageDto;
assert.ok(supportRequest, 'support send request schema is documented');
assert.deepEqual(supportRequest.required, ['idempotencyKey']);
assert.equal(supportRequest.properties?.body?.type, 'string');
assert.equal(supportRequest.properties?.attachmentIds?.maxItems, 4);
assert.equal(supportRequest.properties?.idempotencyKey?.maxLength, 128);

const thread = openapi.paths['/communications/support/thread'].get;
assert.deepEqual(thread.parameters.map(({ name }) => name).sort(), ['limit', 'page']);
assert.deepEqual(thread.security, [{ bearer: [] }]);
const threadResponse = thread.responses['200'].content['application/json'].schema;
assert.equal(threadResponse.$ref, '#/components/schemas/SupportThreadResponseDto');
assert.equal(schemas.SupportThreadResponseDto.properties.messages.items.$ref, '#/components/schemas/SupportMessageResponseDto');
assert.equal(schemas.SupportMessageResponseDto.properties.attachments.items.$ref, '#/components/schemas/SupportAttachmentResponseDto');
assert.deepEqual(schemas.SupportThreadResponseDto.properties.page, { type: 'integer', minimum: 1 });

const upload = openapi.paths['/communications/support/attachments'].post;
const uploadSchema = upload.requestBody.content['multipart/form-data'].schema;
assert.deepEqual(uploadSchema.required, ['file']);
assert.equal(uploadSchema.properties.file.format, 'binary');
assert.equal(upload.responses['201'].content['application/json'].schema.$ref, '#/components/schemas/SupportAttachmentResponseDto');
const download = openapi.paths['/communications/support/attachments/{id}'].get.responses['200'].content;
assert.ok(download['image/png']?.schema.format === 'binary');
assert.ok(download['application/pdf']?.schema.format === 'binary');

const adminSend = openapi.paths['/admin/messages'].post;
assert.deepEqual(adminSend.security, [{ bearer: [] }]);
const adminSendSchema = adminSend.requestBody.content['application/json'].schema;
assert.equal(adminSendSchema.$ref, '#/components/schemas/AdminSendMessageDto');
assert.equal(schemas.AdminSendMessageDto.properties.conversationId.type, 'string');
assert.equal(schemas.AdminSendMessageDto.properties.recipientId.format, 'uuid');
assert.equal(adminSend.responses['201'].content['application/json'].schema.$ref, '#/components/schemas/AdminMessageResponseDto');
const adminUpload = openapi.paths['/admin/messages/{recipientId}/attachments'].post;
assert.equal(adminUpload.requestBody.content['multipart/form-data'].schema.properties.file.format, 'binary');
const adminDownload = openapi.paths['/admin/messages/{recipientId}/attachments/{id}'].get.responses['200'].content;
assert.ok(adminDownload['image/jpeg']?.schema.format === 'binary');
const adminThreadList = openapi.paths['/communications/admin/messages'].get;
assert.deepEqual(adminThreadList.security, [{ bearer: [] }]);
assert.equal(adminThreadList.responses['200'].content['application/json'].schema.type, 'array');
assert.equal(adminThreadList.responses['200'].content['application/json'].schema.items.$ref, '#/components/schemas/AdminMessageResponseDto');

const contactsResponse = openapi.paths['/public/config/support'].get.responses['200'].content['application/json'].schema;
assert.equal(contactsResponse.$ref, '#/components/schemas/PublicSupportContactsResponseDto');
assert.equal(schemas.PublicSupportContactsResponseDto.properties.telegramUrl.nullable, true);
assert.equal(schemas.PublicSupportContactsResponseDto.properties.email.nullable, true);
console.log('communications contract source reconciliation: PASS');
