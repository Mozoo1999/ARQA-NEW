import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { sdk } from "./_core/sdk";

const mobileDraftSchema = z.object({
  sourceType: z.enum(["ocr", "voice_command", "whatsapp"]),
  title: z.string().min(1).max(255),
  intent: z.string().min(1).max(100),
  vendorName: z.string().max(255).optional(),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  currency: z.string().min(3).max(10).default("EGP"),
  documentDate: z.string().max(40).optional(),
  referenceNo: z.string().max(100).optional(),
  taxNo: z.string().max(100).optional(),
  rawContent: z.string().min(1).max(100_000),
  confidence: z.string().regex(/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const mobileAnalysisSchema = z.object({
  sourceType: z.enum(["ocr", "voice_command", "pdf"]),
  rawContent: z.string().min(1).max(100_000),
});

const analysisOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "narqa_mobile_intake_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        intent: { type: "string" },
        title: { type: "string" },
        vendorName: { type: "string" },
        amount: { type: "string" },
        currency: { type: "string" },
        documentDate: { type: "string" },
        referenceNo: { type: "string" },
        taxNo: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reviewSummary: { type: "string" },
      },
      required: ["intent", "title", "vendorName", "amount", "currency", "documentDate", "referenceNo", "taxNo", "confidence", "reviewSummary"],
      additionalProperties: false,
    },
  },
};

function sendUnauthorized(res: Response) {
  res.status(401).json({ error: "Unauthorized mobile session" });
}

async function getAuthenticatedMobileUser(req: Request, res: Response) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    sendUnauthorized(res);
    return null;
  }
}

export function registerMobileRoutes(app: Express) {
  app.get("/api/mobile/dashboard", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res);
    if (!user) return;
    try {
      const [suppliers, projects, contacts, controlTower, drafts] = await Promise.all([
        db.getSuppliers(),
        db.getProjects(),
        db.getAllUsers(),
        db.getControlTowerStats(),
        db.getSmartIntakeDrafts(),
      ]);
      res.json({
        user: { id: user.id, name: user.name, role: user.role },
        suppliers: suppliers.slice(0, 20),
        projects: projects.slice(0, 20),
        contacts: contacts.slice(0, 20).map(contact => ({ id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, role: contact.role })),
        controlTower,
        drafts: drafts.slice(0, 20),
      });
    } catch (error) {
      console.error("[Mobile] Dashboard query failed", error);
      res.status(500).json({ error: "Failed to load mobile dashboard" });
    }
  });

  app.post("/api/mobile/drafts", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res);
    if (!user) return;
    const parsed = mobileDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid mobile draft", issues: parsed.error.issues });
      return;
    }
    try {
      const input = parsed.data;
      const id = await db.createSmartIntakeDraft({
        sourceType: input.sourceType,
        title: input.title,
        intent: input.intent,
        vendorName: input.vendorName ?? null,
        amount: input.amount ?? null,
        currency: input.currency,
        documentDate: input.documentDate ?? null,
        referenceNo: input.referenceNo ?? null,
        taxNo: input.taxNo ?? null,
        rawContent: input.rawContent,
        confidence: input.confidence ?? null,
        status: "pending_review",
      });
      await db.logActivity({ userId: user.id, module: "smart_intake", action: "mobile_draft_created", entityType: "smart_intake_draft", entityId: id, entityLabel: input.title });
      res.status(201).json({ id, status: "pending_review" });
    } catch (error) {
      console.error("[Mobile] Draft creation failed", error);
      res.status(500).json({ error: "Failed to create mobile draft" });
    }
  });

  app.post("/api/mobile/ai/analyze", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res);
    if (!user) return;
    const parsed = mobileAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid mobile analysis input", issues: parsed.error.issues });
      return;
    }
    try {
      const { sourceType, rawContent } = parsed.data;
      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "You are NARQA EBOS intake analysis. Extract only evidence present in Arabic or English input. Never invent values. Return empty strings for unknown fields. This is a review draft, not an accounting posting. Classify intent with a short lower_snake_case label.",
          },
          { role: "user", content: `Source: ${sourceType}\nContent:\n${rawContent}` },
        ],
        response_format: analysisOutputSchema,
      });
      const content = result.choices[0]?.message.content;
      if (typeof content !== "string") throw new Error("AI response was not text");
      const analysis = JSON.parse(content) as Record<string, unknown>;
      await db.logActivity({ userId: user.id, module: "smart_intake", action: "mobile_ai_analysis_requested", entityType: "mobile_analysis", entityId: 0, entityLabel: sourceType });
      res.json({ analysis, model: result.model, requiresReview: true });
    } catch (error) {
      console.error("[Mobile] AI analysis failed", error);
      res.status(502).json({ error: "Project AI analysis is temporarily unavailable" });
    }
  });
}

export const __mobileRouteTestUtils = { mobileDraftSchema, mobileAnalysisSchema };
