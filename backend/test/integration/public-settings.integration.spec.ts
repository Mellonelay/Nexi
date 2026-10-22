import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { AppController } from "../../src/app.controller";
import { AdminService } from "../../src/admin/admin.service";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import { D1PrismaService } from "../../src/d1/d1-prisma.service";
import { D1WorkerBridgeService } from "../../src/d1/d1-worker-bridge.service";
import { LocalSqliteBridgeService } from "../../src/d1/local-sqlite-bridge.service";

describe("Admin Public settings SQLite readback", () => {
  let root: string;
  let bridge: LocalSqliteBridgeService;
  let prisma: D1PrismaService;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "nexi-public-settings-"));
    const filename = join(root, "settings.sqlite");
    const database = new Database(filename);
    database.exec(`
      CREATE TABLE "SystemConfig" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updatedAt" DATETIME NOT NULL
      );
      CREATE TABLE "AdminAuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "target" TEXT,
        "details" TEXT,
        "ipAddress" TEXT,
        "createdAt" DATETIME NOT NULL
      );
    `);
    database.close();

    const config = { get: (key: string) => key === "NEXI_LOCAL_SQLITE_PATH" ? filename : undefined };
    bridge = new LocalSqliteBridgeService(config as never);
    prisma = new D1PrismaService(bridge as unknown as D1WorkerBridgeService, config as never);
  });

  afterEach(async () => {
    await prisma?.$disconnect();
    bridge?.onModuleDestroy();
    rmSync(root, { recursive: true, force: true });
  });

  it("persists Admin quotes categories and reads only safe Public values back", async () => {
    await prisma.$connect();
    const gateway = new D1FinancialCommandGateway(bridge as never);
    const admin = Object.assign(Object.create(AdminService.prototype), { d1: gateway }) as AdminService;
    await admin.updateSystemConfig(
      "admin.frontend.quoteCategories",
      JSON.stringify([
        { id: "Stocks", label: "Stocks", visible: true, order: 1 },
        { id: "Crypto", label: "Crypto", visible: false, order: 0 },
        { id: "unsupported", label: "External", visible: true, order: 2 },
      ]),
      "Public Quotes categories",
      "operator test",
      "admin-test",
    );

    const controller = new AppController({} as never, {} as never, prisma);
    await expect(controller.getPublicQuotesCategories()).resolves.toEqual([
      { id: "Stocks", visible: true, order: 1 },
    ]);
    await expect(prisma.adminAuditLog.count({ where: { target: "admin.frontend.quoteCategories" } })).resolves.toBe(1);
  });

  it("rejects hiding the final visible Quotes category and preserves the saved setting", async () => {
    await prisma.$connect();
    const gateway = new D1FinancialCommandGateway(bridge as never);
    const admin = Object.assign(Object.create(AdminService.prototype), { d1: gateway }) as AdminService;
    const categories = ["Crypto", "Metals", "Forex", "Stocks"].map((id) => ({
      id,
      label: id,
      visible: id === "Stocks",
      order: 1,
    }));
    await admin.updateSystemConfig(
      "admin.frontend.quoteCategories",
      JSON.stringify(categories),
      "Public Quotes categories",
      "operator test",
      "admin-test",
    );

    await expect(admin.updateSystemConfig(
      "admin.frontend.quoteCategories",
      JSON.stringify(categories.map((category) => ({ ...category, visible: false }))),
      "Public Quotes categories",
      "hide all categories",
      "admin-test",
    )).rejects.toThrow("At least one Quotes category must remain visible");
    await expect(admin.updateSystemConfig(
      "admin.frontend.quoteCategories",
      "{",
      "Public Quotes categories",
      "invalid config test",
      "admin-test",
    )).rejects.toThrow("Invalid Quotes category configuration");

    const controller = new AppController({} as never, {} as never, prisma);
    await expect(controller.getPublicQuotesCategories()).resolves.toEqual([
      { id: "Stocks", visible: true, order: 1 },
    ]);
    await expect(prisma.adminAuditLog.count({ where: { target: "admin.frontend.quoteCategories" } })).resolves.toBe(1);
  });

  it("persists Admin translations and limits Public readback to supported shell keys and locales", async () => {
    await prisma.$connect();
    const gateway = new D1FinancialCommandGateway(bridge as never);
    const admin = Object.assign(Object.create(AdminService.prototype), { d1: gateway }) as AdminService;
    await admin.updateSystemConfig(
      "admin.localization.translations",
      JSON.stringify([
        {
          id: "translation-dashboard",
          namespace: "shell",
          key: "dashboard",
          defaultValue: "Dashboard",
          values: { en: "Home", "zh-CN": "首页", fr: "Accueil" },
          updatedAt: "2026-10-22T00:00:00.000Z",
        },
        {
          id: "translation-internal",
          namespace: "internal",
          key: "internalSecret",
          defaultValue: "Internal",
          values: { en: "hidden" },
          updatedAt: "2026-10-22T00:00:00.000Z",
        },
      ]),
      "Admin localization catalog",
      "operator test",
      "admin-test",
    );

    const controller = new AppController({} as never, {} as never, prisma);
    await expect(controller.getPublicLocalization()).resolves.toEqual([
      { key: "dashboard", values: { en: "Home", "zh-CN": "首页" } },
    ]);
    await expect(prisma.adminAuditLog.count({ where: { target: "admin.localization.translations" } })).resolves.toBe(1);
  });
});
