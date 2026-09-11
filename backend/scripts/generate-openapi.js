require('ts-node/register/transpile-only');

const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

process.env.NODE_ENV ??= 'development';
process.env.D1_RUNTIME_ENABLED = 'true';
process.env.D1_BRIDGE_ENABLED = 'true';
process.env.REDIS_URL ??= 'redis://openapi-generator.invalid:6379';
process.env.JWT_SECRET ??= 'openapi-generator-only';

const { AppModule } = require('../src/app.module');

(async () => {
  const app = await NestFactory.create(AppModule, { logger: ['error'], preview: true });
  const config = new DocumentBuilder()
    .setTitle('NEXI API')
    .setDescription('NEXI application and Admin API contract')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outputPath = resolve(process.cwd(), '..', 'docs', 'contracts', 'openapi.json');

  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
  console.log(`OpenAPI artifact written to ${outputPath}`);
})().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
