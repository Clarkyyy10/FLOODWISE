// Community Safety & Reporting Agreement acceptance record.
// Stored locally; when a user is authenticated this can be synced to their
// profile. Bumping AGREEMENT_VERSION re-prompts users to review changes.

export const AGREEMENT_VERSION = "1.0";
export const TERMS_VERSION = "1.0";

const KEY = "fw_agreement";

export interface AgreementRecord {
  version: string;
  termsVersion: string;
  acceptedAt: string; // ISO timestamp
  acknowledgements: string[];
}

export function getAcceptance(): AgreementRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgreementRecord) : null;
  } catch {
    return null;
  }
}

/** True only if the user accepted the CURRENT agreement version. */
export function hasAcceptedAgreement(): boolean {
  const rec = getAcceptance();
  return !!rec && rec.version === AGREEMENT_VERSION;
}

export function acceptAgreement(acknowledgements: string[]): AgreementRecord {
  const rec: AgreementRecord = {
    version: AGREEMENT_VERSION,
    termsVersion: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
    acknowledgements,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage unavailable */
  }
  return rec;
}
