export function isBuyerReady(buyer) {
  return (
    buyer.emailVerified === true &&
    buyer.identityVerificationStatus === "approved" &&
    buyer.financialVerificationStatus === "approved" &&
    buyer.buyerOnboardingCompleted === true &&
    buyer.suspended !== true
  );
}

export function canBroadcastShowing(showing) {
  return showing.paymentStatus === "held" && showing.status === "pending";
}

export function isAgentReady(agent) {
  return (
    agent.emailVerified === true &&
    agent.licenseVerificationStatus === "approved" &&
    agent.brokerageVerificationStatus === "approved" &&
    agent.w9VerificationStatus === "approved" &&
    agent.payoutSetupStatus === "ready" &&
    agent.payoutsEnabled === true &&
    agent.agentOnboardingCompleted === true &&
    agent.approvalStatus === "approved"
  );
}

export function minutesUntil(requestedTime, now = new Date()) {
  return Math.floor((new Date(requestedTime).getTime() - now.getTime()) / 60000);
}

export function findEligibleAgents(agents, showing, now = new Date()) {
  if (!canBroadcastShowing(showing)) {
    return [];
  }

  return agents
    .filter((agent) => {
      const hasArea = agent.serviceAreas?.includes(showing.zipCode);
      const hasNotice = minutesUntil(showing.preferredTime, now) >= agent.requiredNoticeMinutes;
      return (
        isAgentReady(agent) &&
        agent.isAvailable === true &&
        hasArea &&
        hasNotice &&
        agent.phone
      );
    })
    .sort((a, b) => {
      if (b.acceptanceRate !== a.acceptanceRate) {
        return b.acceptanceRate - a.acceptanceRate;
      }
      if (a.averageResponseSeconds !== b.averageResponseSeconds) {
        return a.averageResponseSeconds - b.averageResponseSeconds;
      }
      return a.id.localeCompare(b.id);
    });
}

export function tryAcceptShowing(showing, agentId) {
  if (showing.assignedAgentId || showing.status !== "pending") {
    return { accepted: false, message: "This showing has already been claimed." };
  }

  return {
    accepted: true,
    showing: { ...showing, assignedAgentId: agentId, status: "agent_assigned" },
    message: "You are assigned to this showing.",
  };
}

export function completeShowingAndCreatePayout(showing, agentId) {
  if (showing.assignedAgentId !== agentId || showing.status !== "agent_assigned") {
    return { completed: false, payout: null };
  }

  return {
    completed: true,
    showing: { ...showing, status: "completed", paymentStatus: "released" },
    payout: {
      id: `payout-${showing.id}`,
      showingRequestId: showing.id,
      agentId,
      amountCents: showing.agentPayoutCents,
      status: "released",
    },
  };
}

export function applyAdminAction(subject, action) {
  if (action === "approve_identity") {
    return { ...subject, identityVerificationStatus: "approved" };
  }
  if (action === "reject_identity") {
    return { ...subject, identityVerificationStatus: "rejected" };
  }
  if (action === "approve_financial") {
    return { ...subject, financialVerificationStatus: "approved" };
  }
  if (action === "approve_agent") {
    return { ...subject, approvalStatus: "approved" };
  }
  if (action === "suspend") {
    return { ...subject, suspended: true, approvalStatus: "suspended" };
  }
  if (action === "refund") {
    return { ...subject, paymentStatus: "refunded", status: "refunded" };
  }
  return subject;
}
