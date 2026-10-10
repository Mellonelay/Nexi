function isMissingWorkflowInstance(error) {
  return error?.code === 10400 || /instance\.not_found/i.test(String(error));
}

async function loanWorkflowInstance(workflow, id, loanId) {
  const instance = await workflow.get(id).catch(async (error) => {
    if (!isMissingWorkflowInstance(error)) throw error;
    return workflow.create({ id, params: { loanId } });
  });
  const current = await instance.status().catch(() => ({ status: "unknown" }));
  if (current.status === "complete") return null;
  if (current.status === "errored") await instance.restart();
  return instance;
}
function loanIdFromApproval(event) {
  if (event.type !== "LOAN_APPROVED") return null;

  const loanId =
    typeof event.payload?.loanId === "string" ? event.payload.loanId : "";
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(loanId)) {
    throw new Error("LOAN_APPROVED event is missing a valid loanId");
  }
  return loanId;
}

export async function dispatchLoanApproval(env, event) {
  const loanId = loanIdFromApproval(event);
  if (!loanId) return false;
  if (!env.LOAN_WORKFLOW) {
    throw new Error("LOAN_WORKFLOW binding is unavailable");
  }

  const id = `loan-${loanId}`;
  const instance = await loanWorkflowInstance(env.LOAN_WORKFLOW, id, loanId);
  if (!instance) return true;

  // Cloudflare buffers events sent after instance creation, including before
  // the workflow reaches waitForEvent("loan-decision").
  await instance.sendEvent({
    type: "decision",
    payload: { decision: "APPROVED" },
  });
  return true;
}
