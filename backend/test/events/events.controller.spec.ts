import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { createHmac } from "crypto";
import { EventsController } from "../../src/events/events.controller";

describe("EventsController queue ingress signature", () => {
  const secret = "queue-test-secret";
  const timestamp = String(Date.now());
  const signedEvent = {
    type: "LOAN_APPROVED",
    version: 1,
    idempotencyKey: "loan:123:approved",
    correlationId: "loan:123",
    payload: { loanId: "123" },
  };
  const body = {
    queue: "domain-events",
    messageId: "message-1",
    attempts: 1,
    event: signedEvent,
  };

  function controller() {
    const events = { recordQueueIngress: jest.fn().mockResolvedValue({ replayed: false }) };
    const config = new ConfigService({ JWT_SECRET: secret });
    return { subject: new EventsController(events as never, config), events };
  }

  function signBody(input = body) {
    return createHmac("sha256", secret)
      .update(`${timestamp}:${JSON.stringify(input)}`)
      .digest("hex");
  }

  it("rejects queue metadata or event content altered after signing", async () => {
    const { subject, events } = controller();
    const signed = signBody();
    const alteredBodies = [
      { ...body, queue: "notifications" },
      { ...body, messageId: "message-2" },
      { ...body, attempts: 2 },
      { ...body, event: { ...signedEvent, type: "OTHER_EVENT" } },
      { ...body, event: { ...signedEvent, version: 2 } },
      { ...body, event: { ...signedEvent, correlationId: "other-correlation" } },
      { ...body, event: { ...signedEvent, payload: { loanId: "attacker-loan" } } },
    ];

    for (const altered of alteredBodies) {
      await expect(subject.ingestQueue(altered, signed, timestamp)).rejects.toBeInstanceOf(UnauthorizedException);
    }
    expect(events.recordQueueIngress).not.toHaveBeenCalled();
  });

  it("records an unchanged signed event", async () => {
    const { subject, events } = controller();

    await subject.ingestQueue(body, signBody(), timestamp);

    expect(events.recordQueueIngress).toHaveBeenCalledWith("domain-events", "message-1", 1, signedEvent);
  });
});
