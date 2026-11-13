export type RequestStatus = "pending" | "approved" | "rejected";
export type RequestDecision = "approve" | "reject";

type RequestTransition =
  | { ok: true; status: Exclude<RequestStatus, "pending"> }
  | { ok: false; reason: "already-decided" };

export function transitionRequest(
  status: RequestStatus,
  decision: RequestDecision,
): RequestTransition {
  if (status !== "pending") return { ok: false, reason: "already-decided" };
  return { ok: true, status: decision === "approve" ? "approved" : "rejected" };
}
