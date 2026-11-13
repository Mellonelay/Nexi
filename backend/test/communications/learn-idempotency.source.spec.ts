import { createHash } from "node:crypto";
import { CommunicationsService } from "../../src/communications/communications.service";

const intent = (data: Record<string, unknown>) => {
  const values = Object.keys(data).filter((key) => key !== "reason" && key !== "idempotencyKey")
    .sort().map((key) => [key, data[key]]);
  return createHash("sha256").update(JSON.stringify({
    values, reason: String(data.reason ?? "").trim() || null,
    key: data.idempotencyKey ?? null,
  })).digest("hex");
};

describe("Learn article durable original-intent source contract", () => {
  const input = {
    slug: "original-risk", title: "Risk", body: "Original content",
    reason: "Operator publication", idempotencyKey: "learn-create-123",
  };

  it("returns the original article without creating a second revision on exact create retry", async () => {
    const article = { id: "article-1", slug: input.slug, status: "DRAFT" };
    const stored = {
      aggregateId: article.id, aggregateType: "LEARN_ARTICLE",
      eventType: "LEARN_ARTICLE_CREATED",
      payload: JSON.stringify({ slug: input.slug, status: "DRAFT", intentHash: intent(input) }),
    };
    const eventOutbox = { findUnique: jest.fn(async () => stored) };
    const atomicBatch = jest.fn();
    const service = new CommunicationsService({
      eventOutbox, atomicBatch,
      learnArticle: { findUnique: jest.fn(async () => article) },
    } as any, {} as any, {} as any, {} as any);
    // The committed event's aggregate identity must be the deterministic id.
    (stored as any).aggregateId = (service as any).id("learn-article", input.slug);
    expect(await service.createLearn(input)).toEqual(article);
    expect(atomicBatch).not.toHaveBeenCalled();
  });

  it("rejects changed create payload with the original key before any write", async () => {
    const articleId = "existing";
    const eventOutbox = { findUnique: jest.fn(async () => ({
      aggregateId: articleId, aggregateType: "LEARN_ARTICLE",
      eventType: "LEARN_ARTICLE_CREATED",
      payload: JSON.stringify({ intentHash: "different" }),
    })) };
    const atomicBatch = jest.fn();
    const service = new CommunicationsService({
      eventOutbox, atomicBatch,
    } as any, {} as any, {} as any, {} as any);
    await expect(service.createLearn(input)).rejects.toMatchObject({ status: 409 });
    expect(atomicBatch).not.toHaveBeenCalled();
  });

  it("does not apply an update when its committed original intent matches", async () => {
    const article = { id: "article-1", slug: input.slug, title: input.title };
    const update = { title: "New title", reason: "Editorial change", idempotencyKey: "learn-update-123" };
    const stored = {
      aggregateId: article.id, aggregateType: "LEARN_ARTICLE",
      eventType: "LEARN_ARTICLE_UPDATED",
      payload: JSON.stringify({ intentHash: intent(update) }),
    };
    const atomicBatch = jest.fn();
    const service = new CommunicationsService({
      eventOutbox: { findUnique: jest.fn(async () => stored) },
      learnArticle: { findUnique: jest.fn(async () => article) },
      atomicBatch,
    } as any, {} as any, {} as any, {} as any);
    expect(await service.updateLearn(article.id, update)).toEqual(article);
    expect(atomicBatch).not.toHaveBeenCalled();
  });

  it("reconciles an ambiguous duplicate update commit only with matching durable receipt", async () => {
    const article = { id: "article-1", slug: "original-risk", title: "Updated", status: "DRAFT" };
    const update = { title: "Updated", reason: "Editorial change", idempotencyKey: "learn-update-123" };
    let attempts = 0;
    const eventOutbox = { findUnique: jest.fn(async () => ++attempts === 1 ? null : {
      aggregateId: article.id, aggregateType: "LEARN_ARTICLE",
      eventType: "LEARN_ARTICLE_UPDATED",
      payload: JSON.stringify({ intentHash: intent(update) }),
    }) };
    const atomicBatch = jest.fn(async () => { throw new Error("UNIQUE constraint failed"); });
    const service = new CommunicationsService({
      eventOutbox, atomicBatch,
      learnArticle: { findUnique: jest.fn(async () => article) },
      learnArticleRevision: { findFirst: jest.fn(async () => ({ revision: 1 })) },
    } as any, {} as any, {} as any, {} as any);
    expect(await service.updateLearn(article.id, update)).toEqual(article);
    expect(atomicBatch).toHaveBeenCalledTimes(1);
    expect(eventOutbox.findUnique).toHaveBeenCalledTimes(2);
  });
});
