import type { Property } from "./property-types";

export type Lender = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  nmlsId: string;
  licensedStates: string[];
  serviceZipCodes: string[];
  loanTypes: string[];
  averageResponseMinutes: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export type LenderRow = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string | null;
  nmls_id: string;
  licensed_states: string[] | null;
  service_zip_codes: string[] | null;
  loan_types: string[] | null;
  average_response_minutes: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
};

export function mapLender(row: LenderRow): Lender {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    nmlsId: row.nmls_id,
    licensedStates: row.licensed_states ?? [],
    serviceZipCodes: row.service_zip_codes ?? [],
    loanTypes: row.loan_types ?? [],
    averageResponseMinutes: row.average_response_minutes ?? 30,
    isActive: row.is_active === true,
    isFeatured: row.is_featured === true,
    createdAt: row.created_at,
  };
}

export function getMatchedLendersForProperty(property: Pick<Property, "state" | "zip">, lenders: Lender[]) {
  const state = property.state.trim().toUpperCase();
  const zip = property.zip.trim();

  return lenders
    .filter((lender) => lender.isActive && lender.licensedStates.map((item) => item.toUpperCase()).includes(state))
    .sort((a, b) => {
      const featuredDiff = Number(b.isFeatured) - Number(a.isFeatured);
      if (featuredDiff !== 0) return featuredDiff;

      const aZipMatch = a.serviceZipCodes.length > 0 && a.serviceZipCodes.includes(zip);
      const bZipMatch = b.serviceZipCodes.length > 0 && b.serviceZipCodes.includes(zip);
      const zipDiff = Number(bZipMatch) - Number(aZipMatch);
      if (zipDiff !== 0) return zipDiff;

      return a.averageResponseMinutes - b.averageResponseMinutes;
    });
}

export const lenderDisclaimer =
  "Showings Made Simple is not a lender and does not make credit decisions. Pre-approval is provided by the selected lender, subject to their review, licensing, and underwriting requirements. Lender NMLS information is shown where available.";
