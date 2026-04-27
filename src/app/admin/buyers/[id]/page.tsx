import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoBuyer, demoDocuments } from "@/lib/demo-data";
import { createDocumentViewUrl } from "@/lib/document-access";
import { getSupabaseAdmin } from "@/lib/supabase";

type BuyerProfile = {
  id: string;
  user_id?: string;
  full_name?: string | null;
  phone?: string | null;
  email_verified?: boolean | null;
  identity_verification_status?: string | null;
  financial_verification_status?: string | null;
  government_id_file_url?: string | null;
  selfie_file_url?: string | null;
  prequalification_letter_url?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | null;
  soft_credit_check_consent?: boolean | null;
  buyer_onboarding_completed?: boolean | null;
  suspended?: boolean | null;
  users?: { email?: string | null } | null;
};

type DocumentRow = {
  id: string;
  document_type: string;
  storage_path: string;
  status: string | null;
  uploaded_at: string;
  internal_notes?: string | null;
  view_url?: string | null;
};

function AdminDecisionForm({
  action,
  subjectId,
  label,
  variant = "primary",
}: {
  action: "approve_buyer" | "reject_buyer";
  subjectId: string;
  label: string;
  variant?: "primary" | "danger";
}) {
  return (
    <form action="/api/admin/actions" method="post" className="grid gap-3">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="returnTo" value={`/admin/buyers/${subjectId}`} />
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

function DeleteBuyerForm({ subjectId }: { subjectId: string }) {
  return (
    <form action="/api/admin/actions" method="post" className="mt-6 border-t border-slate-200 pt-5">
      <input type="hidden" name="action" value="delete_buyer" />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="note" value="Admin deleted buyer test account" />
      <button className="min-h-11 w-full rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">
        Delete buyer account
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Deletes the login and linked buyer profile data. Use this for test accounts only.
      </p>
    </form>
  );
}

function DocumentReviewForm({
  action,
  subjectId,
  returnTo,
  label,
  variant = "primary",
}: {
  action: "approve_document" | "reject_document";
  subjectId: string;
  returnTo: string;
  label: string;
  variant?: "primary" | "danger";
}) {
  return (
    <form action="/api/admin/actions" method="post" className="grid gap-2">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <textarea
        name="note"
        rows={2}
        placeholder="Document note"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        className={
          variant === "danger"
            ? "min-h-10 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
            : "min-h-10 rounded-md border border-emerald-300 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        }
      >
        {label}
      </button>
    </form>
  );
}

async function loadBuyer(id: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      buyer: {
        id: demoBuyer.id,
        user_id: demoBuyer.id,
        full_name: demoBuyer.fullName,
        phone: demoBuyer.phone,
        email_verified: demoBuyer.emailVerified,
        identity_verification_status: demoBuyer.identityVerificationStatus,
        financial_verification_status: demoBuyer.financialVerificationStatus,
        government_id_file_url: demoBuyer.governmentIdFileUrl,
        selfie_file_url: demoBuyer.selfieFileUrl,
        prequalification_letter_url: demoBuyer.prequalificationLetterUrl,
        address: demoBuyer.address,
        soft_credit_check_consent: demoBuyer.softCreditCheckConsent,
        buyer_onboarding_completed: demoBuyer.buyerOnboardingCompleted,
        suspended: demoBuyer.suspended,
        users: { email: demoBuyer.email },
      },
      documents: demoDocuments
        .filter((document) => document.ownerId === demoBuyer.id)
        .map((document) => ({
          id: document.id,
          document_type: document.type,
          storage_path: "Demo document",
          status: document.status,
          uploaded_at: document.uploadedAt,
          internal_notes: null,
          view_url: null,
        })),
    };
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("*, users(email)")
    .eq("id", id)
    .maybeSingle<BuyerProfile>();

  if (!buyer) {
    notFound();
  }

  const { data: documents } = buyer.user_id
    ? await supabase
        .from("verification_documents")
        .select("id, document_type, storage_path, status, uploaded_at, internal_notes")
        .eq("owner_user_id", buyer.user_id)
        .order("uploaded_at", { ascending: false })
        .returns<DocumentRow[]>()
    : { data: [] as DocumentRow[] };

  return {
    buyer,
    documents: await Promise.all(
      (documents ?? []).map(async (document) => ({
        ...document,
        view_url: await createDocumentViewUrl(document.storage_path),
      })),
    ),
  };
}

export default async function AdminBuyerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { buyer, documents } = await loadBuyer(id);
  const address = buyer.address;

  return (
    <AppShell>
      <Section>
        <Link href="/admin" className="text-sm font-semibold text-teal-700">Back to admin</Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Buyer review</p>
            <h1 className="mt-1 text-3xl font-semibold">{buyer.full_name ?? "Buyer"}</h1>
            <p className="mt-2 text-sm text-slate-600">{buyer.users?.email ?? buyer.user_id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={buyer.buyer_onboarding_completed ? "approved" : "pending_review"} />
            <StatusBadge status={buyer.suspended ? "suspended" : "active"} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <Card>
              <h2 className="text-lg font-semibold">Profile information</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{buyer.phone ?? "Missing"}</dd></div>
                <div><dt className="text-slate-500">Email</dt><dd><StatusBadge status={buyer.email_verified ? "verified" : "pending_review"} /></dd></div>
                <div><dt className="text-slate-500">Identity</dt><dd><StatusBadge status={buyer.identity_verification_status ?? "pending_review"} /></dd></div>
                <div><dt className="text-slate-500">Financial</dt><dd><StatusBadge status={buyer.financial_verification_status ?? "pending_review"} /></dd></div>
                <div><dt className="text-slate-500">Soft credit consent</dt><dd className="font-medium">{buyer.soft_credit_check_consent ? "Yes" : "No"}</dd></div>
              </dl>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Address</h2>
              <p className="mt-3 text-sm text-slate-700">
                {address ? `${address.street ?? ""}, ${address.city ?? ""}, ${address.state ?? ""} ${address.zipCode ?? ""}` : "No address submitted"}
              </p>
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
                        {document.internal_notes && (
                          <p className="mt-2 text-sm text-slate-600">Note: {document.internal_notes}</p>
                        )}
                      </div>
                      <StatusBadge status={document.status ?? "pending_review"} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
                      {document.view_url ? (
                        <a
                          href={document.view_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                        >
                          View document
                        </a>
                      ) : (
                        <span className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-3 text-sm text-slate-500">
                          Preview unavailable
                        </span>
                      )}
                      <DocumentReviewForm action="approve_document" subjectId={document.id} returnTo={`/admin/buyers/${buyer.id}`} label="Approve document" />
                      <DocumentReviewForm action="reject_document" subjectId={document.id} returnTo={`/admin/buyers/${buyer.id}`} label="Reject document" variant="danger" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Admin decision</h2>
            <p className="mt-2 text-sm text-slate-600">
              Approving unlocks the buyer dashboard and showing requests. Denying marks identity and financial review as rejected.
            </p>
            <div className="mt-5 grid gap-4">
              <AdminDecisionForm action="approve_buyer" subjectId={buyer.id} label="Approve buyer" />
              <AdminDecisionForm action="reject_buyer" subjectId={buyer.id} label="Deny buyer" variant="danger" />
            </div>
            <DeleteBuyerForm subjectId={buyer.id} />
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
