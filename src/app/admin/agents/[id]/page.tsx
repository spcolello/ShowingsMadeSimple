import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoDocuments } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

type AgentProfile = {
  id: string;
  user_id?: string;
  name?: string | null;
  phone?: string | null;
  email_verified?: boolean | null;
  license_number?: string | null;
  license_state?: string | null;
  license_expiration_date?: string | null;
  license_file_url?: string | null;
  license_verification_status?: string | null;
  brokerage_name?: string | null;
  brokerage_address?: string | null;
  broker_manager_name?: string | null;
  broker_manager_email?: string | null;
  broker_manager_phone?: string | null;
  brokerage_verification_status?: string | null;
  w9_file_url?: string | null;
  w9_verification_status?: string | null;
  payout_provider_account_id?: string | null;
  payout_setup_status?: string | null;
  payouts_enabled?: boolean | null;
  agent_onboarding_completed?: boolean | null;
  approval_status?: string | null;
  service_radius_miles?: number | null;
  is_available?: boolean | null;
  users?: { email?: string | null } | null;
};

type DocumentRow = {
  id: string;
  document_type: string;
  storage_path: string;
  status: string | null;
  uploaded_at: string;
  internal_notes?: string | null;
};

function AdminDecisionForm({
  action,
  subjectId,
  label,
  variant = "primary",
}: {
  action: "approve_agent_user" | "reject_agent_user";
  subjectId: string;
  label: string;
  variant?: "primary" | "danger";
}) {
  return (
    <form action="/api/admin/actions" method="post" className="grid gap-3">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="returnTo" value={`/admin/agents/${subjectId}`} />
      <textarea
        name="note"
        rows={3}
        placeholder="Internal note"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        className={
          variant === "danger"
            ? "min-h-11 rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
            : "min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        }
      >
        {label}
      </button>
    </form>
  );
}

function DeleteAgentForm({ subjectId }: { subjectId: string }) {
  return (
    <form action="/api/admin/actions" method="post" className="mt-6 border-t border-slate-200 pt-5">
      <input type="hidden" name="action" value="delete_agent" />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="note" value="Admin deleted agent test account" />
      <button className="min-h-11 w-full rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">
        Delete agent account
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Deletes the login and linked agent profile data. Use this for test accounts only.
      </p>
    </form>
  );
}

async function loadAgent(id: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const agent = demoAgents.find((item) => item.id === id) ?? demoAgents[0];
    return {
      agent: {
        id: agent.id,
        user_id: agent.id,
        name: agent.name,
        phone: agent.phone,
        email_verified: agent.emailVerified,
        license_number: agent.licenseNumber,
        license_state: agent.licenseState,
        license_expiration_date: agent.licenseExpirationDate,
        license_file_url: agent.licenseFileUrl,
        license_verification_status: agent.licenseVerificationStatus,
        brokerage_name: agent.brokerageName,
        brokerage_address: agent.brokerageAddress,
        broker_manager_name: agent.brokerManagerName,
        broker_manager_email: agent.brokerManagerEmail,
        broker_manager_phone: agent.brokerManagerPhone,
        brokerage_verification_status: agent.brokerageVerificationStatus,
        w9_file_url: agent.w9FileUrl,
        w9_verification_status: agent.w9VerificationStatus,
        payout_provider_account_id: agent.payoutProviderAccountId,
        payout_setup_status: agent.payoutSetupStatus,
        payouts_enabled: agent.payoutsEnabled,
        agent_onboarding_completed: agent.agentOnboardingCompleted,
        approval_status: agent.approvalStatus,
        service_radius_miles: agent.serviceRadiusMiles,
        is_available: agent.isAvailable,
        users: { email: agent.email },
      },
      documents: demoDocuments
        .filter((document) => document.ownerId === agent.id)
        .map((document) => ({
          id: document.id,
          document_type: document.type,
          storage_path: "Demo document",
          status: document.status,
          uploaded_at: document.uploadedAt,
        })),
    };
  }

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("*, users(email)")
    .eq("id", id)
    .maybeSingle<AgentProfile>();

  if (!agent) {
    notFound();
  }

  const { data: documents } = agent.user_id
    ? await supabase
        .from("verification_documents")
        .select("id, document_type, storage_path, status, uploaded_at, internal_notes")
        .eq("owner_user_id", agent.user_id)
        .order("uploaded_at", { ascending: false })
        .returns<DocumentRow[]>()
    : { data: [] as DocumentRow[] };

  return { agent, documents: documents ?? [] };
}

export default async function AdminAgentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { agent, documents } = await loadAgent(id);

  return (
    <AppShell>
      <Section>
        <Link href="/admin" className="text-sm font-semibold text-teal-700">Back to admin</Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Agent review</p>
            <h1 className="mt-1 text-3xl font-semibold">{agent.name ?? "Agent"}</h1>
            <p className="mt-2 text-sm text-slate-600">{agent.users?.email ?? agent.user_id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={agent.agent_onboarding_completed ? "approved" : agent.approval_status ?? "pending_review"} />
            <StatusBadge status={agent.is_available ? "available" : "availability_off"} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <Card>
              <h2 className="text-lg font-semibold">License and profile</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{agent.phone ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Email</dt><dd><StatusBadge status={agent.email_verified ? "verified" : "pending_review"} /></dd></div>
                <div><dt className="text-slate-500">License number</dt><dd className="font-medium">{agent.license_number ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">License state</dt><dd className="font-medium">{agent.license_state ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Expiration</dt><dd className="font-medium">{agent.license_expiration_date ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">License status</dt><dd><StatusBadge status={agent.license_verification_status ?? "pending_review"} /></dd></div>
              </dl>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Brokerage</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Brokerage</dt><dd className="font-medium">{agent.brokerage_name ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Address</dt><dd className="font-medium">{agent.brokerage_address ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Manager</dt><dd className="font-medium">{agent.broker_manager_name ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Manager email</dt><dd className="font-medium">{agent.broker_manager_email ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Manager phone</dt><dd className="font-medium">{agent.broker_manager_phone ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Brokerage status</dt><dd><StatusBadge status={agent.brokerage_verification_status ?? "pending_review"} /></dd></div>
              </dl>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Tax and payout</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">W-9</dt><dd><StatusBadge status={agent.w9_verification_status ?? "pending_review"} /></dd></div>
                <div><dt className="text-slate-500">Payout setup</dt><dd><StatusBadge status={agent.payout_setup_status ?? "incomplete"} /></dd></div>
                <div><dt className="text-slate-500">Payout account</dt><dd className="font-medium">{agent.payout_provider_account_id ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Payouts enabled</dt><dd className="font-medium">{agent.payouts_enabled ? "Yes" : "No"}</dd></div>
              </dl>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Documents</h2>
              <div className="mt-4 grid gap-3">
                {documents.length === 0 && <p className="text-sm text-slate-600">No uploaded documents yet.</p>}
                {documents.map((document) => (
                  <div key={document.id} className="rounded-md border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium capitalize">{document.document_type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-600">{document.storage_path}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(document.uploaded_at).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={document.status ?? "pending_review"} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Admin decision</h2>
            <p className="mt-2 text-sm text-slate-600">
              Approving unlocks showing request access. Denying marks license, brokerage, W-9, and account approval as rejected.
            </p>
            <div className="mt-5 grid gap-4">
              <AdminDecisionForm action="approve_agent_user" subjectId={agent.id} label="Approve agent" />
              <AdminDecisionForm action="reject_agent_user" subjectId={agent.id} label="Deny agent" variant="danger" />
            </div>
            <DeleteAgentForm subjectId={agent.id} />
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
