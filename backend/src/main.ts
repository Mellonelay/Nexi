// Import instrumentation before Nest and application modules.
import "./instrument";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ObserveInstrument } from "./observe";
import { ValidationPipe } from "@nestjs/common";
import { RedisIoAdapter } from "./prisma/redis-io.adapter";
import { RuntimeLifecycleService } from "./runtime/runtime-lifecycle.service";
import { resolveRuntimeConfig } from "./runtime/runtime.config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const runtimeConfig = resolveRuntimeConfig();
  const openApiConfig = new DocumentBuilder()
    .setTitle("NEXI API")
    .setDescription("NEXI application and Admin API contract")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("docs", app, openApiDocument, {
    jsonDocumentUrl: "docs-json",
  });
  app.enableShutdownHooks();

  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    // Install the adapter before listen(); its Redis client connects in the
    // background so Cloudflare can observe HTTP liveness independently of
    // external TLS dependency startup.
    redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    app.get(RuntimeLifecycleService).registerSocketAdapter(redisIoAdapter);

    app.enableCors({
      origin: runtimeConfig.corsOrigins,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.listen(runtimeConfig.port, "0.0.0.0");
    console.log(`NEXI API listening on port ${runtimeConfig.port}`);
    return app;
  } catch (error) {
    await redisIoAdapter.close();
    await app.close();
    throw error;
  }
}

void bootstrap().catch((error: unknown) => {
  console.error("NEXI startup failed");
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});
