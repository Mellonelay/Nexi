require("ts-node/register/transpile-only");

const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { dirname, join, resolve } = require("node:path");
const Module = require("node:module");
const { NestFactory } = require("@nestjs/core");
const { DocumentBuilder, SwaggerModule } = require("@nestjs/swagger");

async function loadSwaggerMetadata() {
  const ts = require("typescript");
  const { ReadonlyVisitor } = require("@nestjs/swagger/plugin");
  const cliRoot = dirname(require.resolve("@nestjs/cli/package.json"));
  const { PluginMetadataGenerator } = require(
    join(cliRoot, "lib/compiler/plugins/plugin-metadata-generator.js"),
  );
  const root = resolve(__dirname, "..");
  const { compilerOptions } = require("../nest-cli.json");
  const plugin = compilerOptions.plugins.find(
    ({ name }) => name === "@nestjs/swagger/plugin",
  );
  const config = ts.getParsedCommandLineOfConfigFile(
    join(root, "tsconfig.build.json"),
    {},
    ts.sys,
  );
  if (!config || config.errors.length)
    throw new Error("Cannot read the OpenAPI TypeScript configuration");
  // Read source types without emitting application code; only metadata is transpiled below.
  const program = ts.createProgram(config.fileNames, {
    ...config.options,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    outDir: undefined,
    rootDir: undefined,
  });
  const directory = mkdtempSync(join(root, ".openapi-metadata-"));
  try {
    new PluginMetadataGenerator().generate({
      visitors: [
        new ReadonlyVisitor({ ...plugin.options, pathToSource: directory }),
      ],
      tsProgramRef: program,
      outputDir: directory,
    });
    const filename = join(directory, "metadata.ts");
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const metadataModule = new Module(filename, module);
    metadataModule.filename = filename;
    metadataModule.paths = Module._nodeModulePaths(root);
    metadataModule._compile(outputText, filename);
    await SwaggerModule.loadPluginMetadata(metadataModule.exports.default);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { loadSwaggerMetadata };

if (require.main === module) {
  process.env.NODE_ENV ??= "development";
  process.env.NEXI_SQLITE_LOCAL_ENABLED = "true";
  process.env.NEXI_LOCAL_SQLITE_PATH ??= resolve(
    process.cwd(),
    ".openapi-preview.sqlite",
  );
  process.env.REDIS_URL ??= "redis://openapi-generator.invalid:6379";
  process.env.JWT_SECRET ??= "openapi-generator-only";

  const { AppModule } = require("../src/app.module");

  (async () => {
    await loadSwaggerMetadata();
    const app = await NestFactory.create(AppModule, {
      logger: ["error"],
      preview: true,
    });
    const config = new DocumentBuilder()
      .setTitle("NEXI API")
      .setDescription("NEXI application and Admin API contract")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const outputPath = resolve(
      process.cwd(),
      "..",
      "docs",
      "contracts",
      "openapi.json",
    );

    writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    await app.close();
    console.log(`OpenAPI artifact written to ${outputPath}`);
  })().catch((error) => {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exitCode = 1;
  });
}
