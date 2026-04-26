import assert from "node:assert/strict";
import {
  applyAdminAction,
  canBroadcastShowing,
  completeShowingAndCreatePayout,
  findEligibleAgents,
  isBuyerReady,
  tryAcceptShowing,
} from "../src/lib/mvp-rules.js";

const verifiedBuyer = {
  identityVerificationStatus: "verified",
  financialVerificationStatus: "verified",
  suspended: false,
};

const showing = {
  id: "showing-1",
  zipCode: "33131",
  preferredTime: "2026-04-27T15:00:00Z",
  status: "pending",
  paymentStatus: "held",
  agentPayoutCents: 6000,
};

const agents = [
  {
    id: "agent-fast",
    phone: "+15550000001",
    approvalStatus: "approved",
    available: true,
    serviceAreas: ["33131"],
    requiredNoticeMinutes: 30,
    acceptanceRate: 0.9,
    averageResponseSeconds: 25,
  },
  {
    id: "agent-slow",
    phone: "+15550000002",
    approvalStatus: "approved",
    available: true,
    serviceAreas: ["33131"],
    requiredNoticeMinutes: 30,
    acceptanceRate: 0.8,
    averageResponseSeconds: 120,
  },
  {
    id: "agent-pending",
    phone: "+15550000003",
    approvalStatus: "pending_review",
    available: true,
    serviceAreas: ["33131"],
    requiredNoticeMinutes: 30,
    acceptanceRate: 1,
    averageResponseSeconds: 5,
  },
];

assert.equal(isBuyerReady(verifiedBuyer), true, "verified buyer should proceed");
assert.equal(
  isBuyerReady({ ...verifiedBuyer, financialVerificationStatus: "pending_review" }),
  false,
  "financial review should block showing request",
);
assert.equal(
  isBuyerReady({ ...verifiedBuyer, suspended: true }),
  false,
  "suspended buyer should be blocked",
);

assert.equal(canBroadcastShowing(showing), true, "held payment can broadcast");
assert.equal(
  canBroadcastShowing({ ...showing, paymentStatus: "unpaid" }),
  false,
  "unpaid showing cannot broadcast",
);

const eligible = findEligibleAgents(agents, showing, new Date("2026-04-26T12:00:00Z"));
assert.deepEqual(
  eligible.map((agent) => agent.id),
  ["agent-fast", "agent-slow"],
  "only approved available agents should be ranked",
);

const first = tryAcceptShowing(showing, "agent-fast");
assert.equal(first.accepted, true, "first agent should accept");
assert.equal(first.showing.status, "agent_assigned", "showing should be assigned");
const second = tryAcceptShowing(first.showing, "agent-slow");
assert.equal(second.accepted, false, "double acceptance should be blocked");

assert.equal(
  applyAdminAction(verifiedBuyer, "reject_identity").identityVerificationStatus,
  "rejected",
  "admin can reject identity",
);
assert.equal(
  applyAdminAction({ approvalStatus: "pending_review" }, "approve_agent").approvalStatus,
  "approved",
  "admin can approve agent",
);
assert.equal(
  applyAdminAction({ paymentStatus: "held", status: "pending" }, "refund").paymentStatus,
  "refunded",
  "admin can refund",
);

const assigned = { ...showing, status: "agent_assigned", assignedAgentId: "agent-fast" };
const completed = completeShowingAndCreatePayout(assigned, "agent-fast");
assert.equal(completed.completed, true, "showing should complete");
assert.equal(completed.showing.paymentStatus, "released", "payment should release");
assert.equal(completed.payout.amountCents, 6000, "payout should match agent amount");

console.log("MVP workflow tests passed");
