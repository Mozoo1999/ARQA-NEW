export const OPERATIONAL_SECTORS = ["construction", "supply", "logistics", "general"] as const;
export const OPERATIONAL_LEVELS = ["construction_company", "supply_office", "logistics_operator", "general"] as const;

export type OperationalSector = typeof OPERATIONAL_SECTORS[number];
export type OperationalBusinessLevel = typeof OPERATIONAL_LEVELS[number];

export type MobileOperationalProfile = {
  primaryLanguage: "ar" | "en";
  dialect: string;
  sector: OperationalSector;
  businessLevel: OperationalBusinessLevel;
  defaultUnit: string;
  materialVocabulary: string[];
  configured: boolean;
};

type AuthenticatedRequest = { apiBaseUrl: string; token: string; signal?: AbortSignal };

function profileError(response: Response, body: unknown) {
  const message = body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
    ? (body as { error: string }).error
    : "تعذر الاتصال بسياق التشغيل.";
  return new Error(response.status === 401 ? "انتهت جلسة الجوال. سجّل الدخول مجدداً." : message);
}

async function readProfile(response: Response): Promise<MobileOperationalProfile> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw profileError(response, body);
  const profile = body as Partial<MobileOperationalProfile>;
  if (!profile || (profile.primaryLanguage !== "ar" && profile.primaryLanguage !== "en") || typeof profile.dialect !== "string" || !OPERATIONAL_SECTORS.includes(profile.sector as OperationalSector) || !OPERATIONAL_LEVELS.includes(profile.businessLevel as OperationalBusinessLevel) || !Array.isArray(profile.materialVocabulary)) throw new Error("استجاب الخادم بسياق تشغيل غير صالح.");
  return {
    primaryLanguage: profile.primaryLanguage,
    dialect: profile.dialect,
    sector: profile.sector as OperationalSector,
    businessLevel: profile.businessLevel as OperationalBusinessLevel,
    defaultUnit: typeof profile.defaultUnit === "string" ? profile.defaultUnit : "",
    materialVocabulary: profile.materialVocabulary.filter((value): value is string => typeof value === "string"),
    configured: profile.configured === true,
  };
}

function headers(token: string) { return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; }

export async function fetchMobileOperationalProfile(input: AuthenticatedRequest) {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/operational-profile`, { headers: { Authorization: `Bearer ${input.token}` }, signal: input.signal });
  return readProfile(response);
}

export async function updateMobileOperationalProfile(input: AuthenticatedRequest & Omit<MobileOperationalProfile, "configured">) {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/operational-profile`, {
    method: "PUT",
    headers: headers(input.token),
    signal: input.signal,
    body: JSON.stringify({ primaryLanguage: input.primaryLanguage, dialect: input.dialect, sector: input.sector, businessLevel: input.businessLevel, defaultUnit: input.defaultUnit, materialVocabulary: input.materialVocabulary }),
  });
  return readProfile(response);
}
