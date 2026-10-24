import { BadRequestException } from "@nestjs/common";
import { assertSupportEntryPoints, normalizePublicSupportContacts } from "../../src/admin/public-ui-config";

describe("Public support contact configuration", () => {
  it("exposes only visible validated Telegram and email entries", () => {
    expect(normalizePublicSupportContacts([
      { channel: "telegram", target: "https://t.me/nexi_support", visible: true },
      { channel: "email", target: "support@nexi.example", visible: true },
      { channel: "telegram", target: "javascript:alert(1)", visible: true },
      { channel: "email", target: "hidden@nexi.example", visible: false },
    ])).toEqual({ telegramUrl: "https://t.me/nexi_support", email: "support@nexi.example" });
  });

  it("accepts clearing contacts but rejects unsafe active destinations", () => {
    expect(() => assertSupportEntryPoints(JSON.stringify([
      { id: "public-support-telegram", channel: "telegram", target: "", visible: false },
      { id: "public-support-email", channel: "email", target: "", visible: false },
    ]))).not.toThrow();
    expect(() => assertSupportEntryPoints(JSON.stringify([
      { id: "public-support-telegram", channel: "telegram", target: "javascript:alert(1)", visible: true },
    ]))).toThrow(BadRequestException);
  });
});
