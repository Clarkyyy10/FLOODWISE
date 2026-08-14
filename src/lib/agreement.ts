// Community Safety & Reporting Agreement acceptance record.
// Stored locally; when a user is authenticated this can be synced to their
// profile. Bumping AGREEMENT_VERSION re-prompts users to review changes.

export const AGREEMENT_VERSION = "1.0";
export const TERMS_VERSION = "1.0";
export const PRIVACY_VERSION = "1.0";

// Human-readable dates shown on the Terms & Conditions page.
export const TERMS_EFFECTIVE_DATE = "August 14, 2026";
export const TERMS_LAST_UPDATED = "August 14, 2026";

const KEY = "fw_agreement";
const TERMS_KEY = "fw_terms_acceptance";

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

// -----------------------------------------------------------------------------
// Terms & Conditions acceptance (tracked separately so a new Terms version can
// re-prompt users without resetting the whole onboarding agreement).
// -----------------------------------------------------------------------------

export interface TermsRecord {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string; // ISO timestamp
  acknowledgements: string[];
  userId?: string;
}

export function getTermsAcceptance(): TermsRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TERMS_KEY);
    return raw ? (JSON.parse(raw) as TermsRecord) : null;
  } catch {
    return null;
  }
}

/** True only if the user accepted the CURRENT Terms version. */
export function hasAcceptedTerms(): boolean {
  const rec = getTermsAcceptance();
  return !!rec && rec.termsVersion === TERMS_VERSION;
}

export function acceptTerms(acknowledgements: string[], userId?: string): TermsRecord {
  const rec: TermsRecord = {
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    acceptedAt: new Date().toISOString(),
    acknowledgements,
    userId,
  };
  try {
    localStorage.setItem(TERMS_KEY, JSON.stringify(rec));
  } catch {
    /* storage unavailable */
  }
  return rec;
}
