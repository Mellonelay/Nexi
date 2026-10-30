const assert = require("node:assert/strict");
const { readdirSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { loadSwaggerMetadata } = require("../../scripts/generate-openapi");

test("source generator loads configured Swagger metadata without application bootstrap", async () => {
  const root = resolve(__dirname, "../..");
  const temporaryFiles = () =>
    readdirSync(root).filter((name) => name.startsWith(".openapi-metadata-"));
  const before = temporaryFiles();
  await loadSwaggerMetadata();

  const {
    Body,
    Controller,
    Get,
    Module,
    Patch,
    Post,
    Query,
  } = require("@nestjs/common");
  const { NestFactory } = require("@nestjs/core");
  const { DocumentBuilder, SwaggerModule } = require("@nestjs/swagger");
  const { WalletChallengeDto } = require("../../src/auth/auth.dto");
  const {
    ContentLocaleQueryDto,
  } = require("../../src/communications/communications.dto");
  const {
    UpdateLoanPlanDto,
    UpdateMiningPlanDto,
  } = require("../../src/admin/admin.dto");
  class ContractController {
    challenge(body) {
      return body;
    }
    content(query) {
      return query;
    }
    updateMining(body) {
      return body;
    }
    updateLoan(body) {
      return body;
    }
  }
  Controller("contract")(ContractController);
  for (const [name, decorator, parameter, type] of [
    ["challenge", Post(), Body(), WalletChallengeDto],
    ["content", Get(), Query(), ContentLocaleQueryDto],
    ["updateMining", Patch(), Body(), UpdateMiningPlanDto],
    ["updateLoan", Patch(), Body(), UpdateLoanPlanDto],
  ]) {
    decorator(
      ContractController.prototype,
      name,
      Object.getOwnPropertyDescriptor(ContractController.prototype, name),
    );
    parameter(ContractController.prototype, name, 0);
    Reflect.defineMetadata(
      "design:paramtypes",
      [type],
      ContractController.prototype,
      name,
    );
  }
  class ContractModule {}
  Module({ controllers: [ContractController] })(ContractModule);
  const app = await NestFactory.create(ContractModule, {
    logger: false,
    preview: true,
  });
  try {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const wallet = document.components.schemas.WalletChallengeDto;
    assert.equal(wallet.properties.address.type, "string");
    assert.equal(wallet.properties.chainId.type, "number");
    assert.equal(wallet.properties.chainId.minimum, 1);
    assert.deepEqual(wallet.required, ["address", "chainId"]);
    const locale = document.paths["/contract"].get.parameters.find(
      (entry) => entry.name === "locale",
    );
    assert.equal(locale.in, "query");
    assert.equal(locale.required, false);
    assert.equal(locale.schema.minLength, 2);
    for (const name of ["UpdateMiningPlanDto", "UpdateLoanPlanDto"]) {
      const update = document.components.schemas[name];
      assert.ok(Object.keys(update.properties).length > 0);
      assert.equal(update.required?.length ?? 0, 0);
    }
  } finally {
    await app.close();
  }
  assert.deepEqual(temporaryFiles(), before);
});
