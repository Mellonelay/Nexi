import { AdminController } from "../../src/admin/admin.controller";

const response = (method: keyof AdminController, status = "200") => {
  const responses = Reflect.getMetadata(
    "swagger/apiResponse",
    AdminController.prototype[method],
  ) as Record<string, { schema?: Record<string, any>; description?: string }> | undefined;
  return responses?.[status];
};
const responseSchema = (method: keyof AdminController, status = "200") =>
  response(method, status)?.schema;

describe("Admin identity and configuration response metadata", () => {
  it("documents the fields returned by the Admin identity handler", () => {
    expect(responseSchema("getAdminIdentity")).toMatchObject({
      type: "object",
      required: [
        "id",
        "email",
        "backendRole",
        "authSurface",
        "environment",
        "permissionModel",
        "roleId",
        "roleLabel",
        "effectivePermissions",
        "roleMappingStatus",
      ],
      properties: {
        environment: { enum: ["DEVELOPMENT", "SANDBOX", "PRODUCTION"] },
        permissionModel: { enum: ["ADMIN_ROLE_ASSIGNMENT"] },
        roleId: { nullable: true },
        roleLabel: { nullable: true },
        roleMappingStatus: {
          enum: ["ASSIGNED", "UNASSIGNED_ADMIN_REQUIRES_ROLE_ASSIGNMENT"],
        },
      },
    });
  });

  it("documents role definitions and their permission keys", () => {
    expect(responseSchema("listAdminRoleDefinitions")).toMatchObject({
      type: "array",
      items: {
        type: "object",
        required: ["id", "label", "description", "permissions"],
        properties: {
          id: { type: "string", enum: expect.arrayContaining(["super_admin"]) },
          label: { type: "string" },
          description: { type: "string" },
          permissions: {
            type: "array",
            items: { type: "string", enum: expect.arrayContaining(["roles.view"]) },
          },
        },
      },
    });
  });

  it("documents system configuration values as string-valued keyed entries", () => {
    expect(responseSchema("getSystemConfig")).toMatchObject({
      type: "object",
      required: ["status", "timeframes", "marketStats", "config"],
      properties: {
        status: { enum: ["ok"] },
        timeframes: {
          type: "array",
          items: {
            required: ["id", "name", "seconds", "payoutRate", "profitRatio", "lossRatio", "isActive"],
            properties: {
              seconds: { type: "integer" },
              payoutRate: { type: "string" },
              isActive: { type: "boolean" },
            },
          },
        },
        marketStats: {
          type: "array",
          items: {
            properties: {
              category: { type: "string" },
              _count: { additionalProperties: { type: "integer" } },
            },
          },
        },
        config: { type: "object", additionalProperties: { type: "string" } },
      },
    });
  });

  it("documents the Admin spot margin configuration consumed by the provider", () => {
    const schema = {
      type: "object",
      required: ["maintenanceRatio", "leverages"],
      properties: {
        maintenanceRatio: { type: "number" },
        leverages: { type: "array", items: { type: "number" } },
      },
    };
    expect(responseSchema("getMarginConfiguration")).toMatchObject(schema);
    expect(responseSchema("updateMarginConfiguration", "201")).toMatchObject(schema);
  });

  it("documents audited Admin spot and Binary mutation responses", () => {
    expect(responseSchema("cancelAdminSpotOrder", "201")).toMatchObject({
      type: "object",
      required: ["ok", "auditId", "state"],
      properties: {
        ok: { type: "boolean" },
        auditId: { type: "string" },
        state: { type: "string" },
      },
    });
    for (const method of ["setSpotPairMaintenance", "setBinaryPairMaintenance"] as const) {
      expect(responseSchema(method, "201")).toMatchObject({
        type: "object",
        required: ["ok", "auditId", "status"],
        properties: {
          ok: { type: "boolean" },
          auditId: { type: "string" },
          status: { type: "string" },
        },
      });
    }
    for (const method of ["updateMarginConfiguration", "cancelAdminSpotOrder", "setSpotPairMaintenance", "setBinaryPairMaintenance"] as const) {
      expect(response(method, "400")?.description).toBeTruthy();
    }
    for (const method of ["cancelAdminSpotOrder", "setSpotPairMaintenance", "setBinaryPairMaintenance"] as const) {
      expect(response(method, "404")?.description).toBeTruthy();
    }
  });
});
