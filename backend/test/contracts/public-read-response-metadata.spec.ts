import { WalletController } from "../../src/wallet/wallet.controller";
import { MiningController } from "../../src/mining/mining.controller";
import { SpotController } from "../../src/spot/spot.controller";
import { MarginController } from "../../src/spot/margin.controller";
import { AuthController } from "../../src/auth/auth.controller";
import { KycController } from "../../src/kyc/kyc.controller";
import { AppController } from "../../src/app.controller";
import { HealthController } from "../../src/observability/health.controller";
import { CommunicationsController } from "../../src/communications/communications.controller";
import { MessageReadResponseDto } from "../../src/communications/communications.dto";
import { BinaryController } from "../../src/binary/binary.controller";
import { MarketPublicController } from "../../src/market/market-public.controller";

const responseSchema = (controller: object, method: string, status = "200") => {
  const responses = Reflect.getMetadata(
    "swagger/apiResponse",
    (controller as unknown as Record<string, object>)[method],
  ) as Record<string, { schema?: Record<string, any> }> | undefined;
  return responses?.[status]?.schema;
};

describe("Public read response metadata", () => {
  it("documents persisted read receipts consumed by Public and Admin", () => {
    for (const method of ["readMessage", "markAdminMessageRead"]) {
      const responses = Reflect.getMetadata(
        "swagger/apiResponse",
        (CommunicationsController.prototype as unknown as Record<string, object>)[method],
      ) as Record<string, { type?: unknown }> | undefined;
      expect(responses?.["201"]?.type).toBe(MessageReadResponseDto);
    }
  });

  it("documents the wallet challenge and verification payloads consumed by Public", () => {
    expect(responseSchema(AuthController.prototype, "walletChallenge", "201")).toMatchObject({
      required: ["message", "nonce", "domain", "uri", "chainId", "issuedAt", "expirationTime"],
      properties: { chainId: { type: "integer", enum: [1] }, expirationTime: { type: "string", format: "date-time" } },
    });
    expect(responseSchema(AuthController.prototype, "walletVerify", "201")).toMatchObject({
      required: ["access_token", "user", "profile", "metadata"],
      properties: {
        access_token: { type: "string" },
        profile: { properties: { referral: { type: "object", nullable: true }, vip: { type: "object", nullable: true } } },
        metadata: { properties: { sessionSurface: { enum: ["PUBLIC"] } } },
      },
    });
  });

  it("documents Public preference and session read-back shapes", () => {
    expect(responseSchema(AuthController.prototype, "preferences")).toMatchObject({
      properties: { notificationSettings: { additionalProperties: { type: "boolean" }, nullable: true }, tradingSettings: { additionalProperties: true, nullable: true } },
    });
    expect(responseSchema(AuthController.prototype, "updatePreferences")).toMatchObject({ properties: { locale: { type: "string" }, theme: { type: "string" } } });
    expect(responseSchema(AuthController.prototype, "sessions")).toMatchObject({
      type: "array", items: { required: ["id", "surface", "createdAt", "lastUsedAt", "absoluteExpiresAt", "idleExpiresAt", "revokedAt", "revokeReason", "userAgentHash", "ipHash"] },
    });
  });

  it("documents the profile shape returned after Public profile updates", () => {
    expect(responseSchema(AuthController.prototype, "updateMe")).toMatchObject({
      required: ["id", "email", "displayName", "walletAddress", "chainId", "kycStatus", "referral", "vip"],
      properties: {
        referral: { type: "object", nullable: true },
        vip: { type: "object", nullable: true },
      },
    });
  });

  it("documents the Public Binary configuration fields", () => {
    expect(responseSchema(BinaryController.prototype, "getConfig")).toMatchObject({
      required: ["durations", "configurations"],
      properties: {
        durations: { type: "array", items: { type: "integer" } },
        configurations: { type: "array", items: { required: ["id", "pair", "durationSeconds", "payoutRate", "lossRate", "minStake", "maxStake", "settlementDelaySeconds", "version", "enabled", "createdAt", "updatedAt"] } },
      },
    });
  });

  it("declares the current Public wallet activity success schema", () => {
    const responses = Reflect.getMetadata(
      "swagger/apiResponse",
      (WalletController.prototype as unknown as Record<string, object>).getActivity,
    ) as Record<string, { type?: unknown }> | undefined;
    expect(responses?.["200"]?.type).toBeDefined();
  });

  it("documents the Public market asset envelope and extensible provider metadata", () => {
    expect(responseSchema(MarketPublicController.prototype, "getAsset")).toMatchObject({
      required: ["id", "symbol", "displaySymbol", "displayName", "category", "status", "baseAsset", "quoteAsset", "canonicalAssetId", "assetClass", "details"],
      properties: {
        details: {
          required: ["symbol", "category", "status", "refreshedAt", "expiresAt", "provenance"],
          additionalProperties: true,
        },
      },
    });
  });

  it("documents the Public auth mutation responses consumed by Settings and refresh", () => {
    expect(responseSchema(AuthController.prototype, "refresh", "201")).toMatchObject({
      required: ["access_token", "user"], properties: { access_token: { type: "string" }, user: { type: "object" } },
    });
    expect(responseSchema(AuthController.prototype, "revokeSession", "201")).toMatchObject({ properties: { revoked: { type: "boolean" } } });
    expect(responseSchema(AuthController.prototype, "changeSecurityPassword", "201")).toMatchObject({ properties: { changed: { type: "boolean", enum: [true] } } });
    expect(responseSchema(AuthController.prototype, "setupMfa", "201")).toMatchObject({ required: ["secret", "uri"] });
    expect(responseSchema(AuthController.prototype, "verifyMfa", "201")).toMatchObject({ properties: { enabled: { enum: [true] } } });
    expect(responseSchema(AuthController.prototype, "disableMfa", "201")).toMatchObject({ properties: { enabled: { enum: [false] } } });
    expect(responseSchema(AuthController.prototype, "generateBackupCodes", "201")).toMatchObject({ properties: { codes: { type: "array", minItems: 10, maxItems: 10 } } });
  });

  it("documents the KYC evidence identifier returned to Public Settings", () => {
    const metadata = Reflect.getMetadata(
      "swagger/apiResponse",
      (KycController.prototype as unknown as Record<string, object>).uploadEvidence,
    ) as Record<string, { schema?: Record<string, any> }> | undefined;
    expect(metadata?.["201"]?.schema).toMatchObject({
      required: ["evidenceId", "status"],
      properties: { evidenceId: { type: "string", format: "uuid" }, status: { enum: ["UPLOADED"] } },
    });
  });

  it("documents fixed liveness probe payloads", () => {
    expect(responseSchema(AppController.prototype, "getLiveness")).toMatchObject({ properties: { status: { enum: ["UP"] } } });
    expect(responseSchema(HealthController.prototype, "live")).toMatchObject({ required: ["status", "service"], properties: { service: { enum: ["nexi-api"] } } });
  });

  it("describes wallet overview balance scopes without losing decimal strings", () => {
    expect(responseSchema(WalletController.prototype, "getOverview")).toMatchObject({
      required: ["currencies", "assets"],
      properties: {
        currencies: { type: "array", items: { type: "string" } },
        assets: {
          items: {
            properties: {
              scopes: {
                required: ["MAIN"],
                additionalProperties: {
                  properties: {
                    available: { type: "string" },
                    locked: { type: "string" },
                    total: { type: "string" },
                    accountExists: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it("describes the exact mining summary output", () => {
    expect(responseSchema(MiningController.prototype, "getSummary")).toMatchObject({
      required: ["activeSubscriptions", "totalSubscriptions", "lockedPrincipal", "accruedRewards", "postedRewards"],
      properties: {
        activeSubscriptions: { type: "integer" },
        totalSubscriptions: { type: "integer" },
        lockedPrincipal: { type: "string" },
        accruedRewards: { type: "string" },
        postedRewards: { type: "string" },
      },
    });
  });

  it("documents the Public profile and security state shapes", () => {
    expect(responseSchema(AuthController.prototype, "me")).toMatchObject({
      required: ["id", "email", "displayName", "walletAddress", "chainId", "kycStatus", "referral", "vip"],
      properties: {
        chainId: { type: "integer", nullable: true },
        referral: {
          properties: {
            referralCode: { type: "string" },
            totalEarnings: { type: "string" },
            referredByUserCode: { type: "integer", nullable: true },
          },
        },
      },
    });
    expect(responseSchema(AuthController.prototype, "securityStatus")).toMatchObject({
      required: ["passwordSet", "mfa"],
      properties: {
        passwordSet: { type: "boolean" },
        mfa: { required: ["enabled", "hasSecret", "hasBackupCodes"] },
      },
    });
  });

  it("describes matched spot trades and the margin quote consumed by Public", () => {
    expect(responseSchema(SpotController.prototype, "getMarketTrades")).toMatchObject({
      type: "array",
      items: {
        required: ["id", "pair", "price", "amount", "executedAt", "side", "source"],
        properties: {
          executedAt: { type: "string", format: "date-time" },
          side: { enum: ["MATCHED"] },
        },
      },
    });
    expect(responseSchema(MarginController.prototype, "getQuote")).toMatchObject({
      required: ["pair", "state", "price", "quoteId", "provider", "source", "observedAt", "receivedAt", "maintenanceRatio", "leverageOptions"],
      properties: {
        state: { enum: ["LIVE"] },
        observedAt: { nullable: true },
        leverageOptions: { type: "array", items: { type: "number" } },
      },
    });
  });
});
