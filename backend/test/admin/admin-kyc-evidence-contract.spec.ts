import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { AdminController } from "../../src/admin/admin.controller";
import { ADMIN_PERMISSION_KEY } from "../../src/admin/admin-permission.decorator";

describe("Admin KYC evidence contract", () => {
  it("keeps document reads on the Admin surface behind kyc.view", () => {
    const handler = AdminController.prototype.getKycEvidence;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe("kyc/:userId/evidence/:side");
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, handler)).toBe("kyc.view");
    expect(Reflect.getMetadata(PATH_METADATA, AdminController)).toBe("admin");
  });
});
