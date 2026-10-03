import { eq } from "drizzle-orm";
import { operationalProfiles } from "../drizzle/schema";
import * as db from "./db";

export const OPERATIONAL_SECTORS = ["construction", "supply", "logistics", "general"] as const;
export const OPERATIONAL_LEVELS = ["construction_company", "supply_office", "logistics_operator", "general"] as const;

export type OperationalSector = typeof OPERATIONAL_SECTORS[number];
export type OperationalBusinessLevel = typeof OPERATIONAL_LEVELS[number];

export type OperationalProfile = {
  primaryLanguage: "ar" | "en";
  dialect: string;
  sector: OperationalSector;
  businessLevel: OperationalBusinessLevel;
  defaultUnit: string;
  materialVocabulary: string[];
  configured: boolean;
};

export type OperationalProfileInput = Omit<OperationalProfile, "configured">;

const defaultVocabulary = ["سن", "زلط", "رمل"];

export const DEFAULT_OPERATIONAL_PROFILE: OperationalProfile = {
  primaryLanguage: "ar",
  dialect: "ar-SA",
  sector: "general",
  businessLevel: "general",
  defaultUnit: "",
  materialVocabulary: [],
  configured: false,
};

function uniqueVocabulary(values: string[]) {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean))).slice(0, 32);
}

export function normalizeOperationalProfile(input: Partial<OperationalProfileInput>): OperationalProfileInput {
  const primaryLanguage = input.primaryLanguage === "en" ? "en" : "ar";
  const sector = OPERATIONAL_SECTORS.includes(input.sector as OperationalSector) ? input.sector as OperationalSector : "general";
  const businessLevel = OPERATIONAL_LEVELS.includes(input.businessLevel as OperationalBusinessLevel) ? input.businessLevel as OperationalBusinessLevel : "general";
  const defaultUnit = (input.defaultUnit ?? "").trim().slice(0, 32);
  const suppliedVocabulary = Array.isArray(input.materialVocabulary) ? input.materialVocabulary : [];
  const materialVocabulary = uniqueVocabulary(suppliedVocabulary.length ? suppliedVocabulary : sector === "construction" ? defaultVocabulary : []);
  const dialect = (input.dialect ?? (primaryLanguage === "ar" ? "ar-SA" : "en-US")).trim().slice(0, 24) || (primaryLanguage === "ar" ? "ar-SA" : "en-US");
  return { primaryLanguage, dialect, sector, businessLevel, defaultUnit, materialVocabulary };
}

function mapStoredProfile(row: typeof operationalProfiles.$inferSelect): OperationalProfile {
  return {
    primaryLanguage: row.primaryLanguage === "en" ? "en" : "ar",
    dialect: row.dialect,
    sector: row.sector as OperationalSector,
    businessLevel: row.businessLevel as OperationalBusinessLevel,
    defaultUnit: row.defaultUnit ?? "",
    materialVocabulary: uniqueVocabulary(Array.isArray(row.materialVocabulary) ? row.materialVocabulary.filter((value): value is string => typeof value === "string") : []),
    configured: true,
  };
}

export async function getOperationalProfile(userId: number): Promise<OperationalProfile> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const row = (await database.select().from(operationalProfiles).where(eq(operationalProfiles.userId, userId)).limit(1))[0];
  return row ? mapStoredProfile(row) : DEFAULT_OPERATIONAL_PROFILE;
}

export async function saveOperationalProfile(userId: number, input: Partial<OperationalProfileInput>): Promise<OperationalProfile> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const profile = normalizeOperationalProfile(input);
  const values = {
    primaryLanguage: profile.primaryLanguage,
    dialect: profile.dialect,
    sector: profile.sector,
    businessLevel: profile.businessLevel,
    defaultUnit: profile.defaultUnit || null,
    materialVocabulary: profile.materialVocabulary,
    updatedAt: new Date(),
  };
  const existing = (await database.select({ id: operationalProfiles.id }).from(operationalProfiles).where(eq(operationalProfiles.userId, userId)).limit(1))[0];
  if (existing) {
    await database.update(operationalProfiles).set(values).where(eq(operationalProfiles.id, existing.id));
  } else {
    await database.insert(operationalProfiles).values({ userId, ...values });
  }
  await db.logActivity({ userId, module: "operational_profile", action: "profile_updated", entityType: "operational_profile", entityId: existing?.id ?? null, entityLabel: `${profile.sector}/${profile.businessLevel}` });
  return { ...profile, configured: true };
}
