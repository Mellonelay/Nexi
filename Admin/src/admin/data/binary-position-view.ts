export function isOngoingBinaryPositionStatus(status: string) {
  return status === "open" || status === "settling";
}
