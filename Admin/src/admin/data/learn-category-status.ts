export function learnCategoryStatusUpdate(currentStatus: "ACTIVE" | "INACTIVE") {
  return {
    expectedStatus: currentStatus,
    status: currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
  } as const;
}
