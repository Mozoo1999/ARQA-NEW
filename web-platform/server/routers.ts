import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const managerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") throw new TRPCError({ code: "FORBIDDEN", message: "Manager or Admin access required" });
  return next({ ctx });
});

// ─────────────────────────────────────────────────────────────────────────────
// APP ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── AUTH ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── USERS ─────────────────────────────────────────────────────────────────
  users: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const user = await db.getUserById(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return user;
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "manager", "user"]).optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      departmentId: z.number().nullable().optional(),
      branchId: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateUser(id, data);
      await db.logActivity({ userId: ctx.user.id, module: "users", action: "updated", entityType: "user", entityId: id });
      return { success: true };
    }),
  }),

  // ── COMPANY ───────────────────────────────────────────────────────────────
  company: router({
    get: protectedProcedure.query(async () => {
      return db.getCompany();
    }),
    upsert: adminProcedure.input(z.object({
      name: z.string().min(1),
      nameEn: z.string().optional(),
      registrationNumber: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      description: z.string().optional(),
      foundedYear: z.number().optional(),
      employeeCount: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.upsertCompany(input);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "upserted", entityType: "company", entityId: id, entityLabel: input.name });
      return { id };
    }),
  }),

  // ── BRANCHES ──────────────────────────────────────────────────────────────
  branches: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getBranches(input?.companyId);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const branch = await db.getBranchById(input.id);
      if (!branch) throw new TRPCError({ code: "NOT_FOUND" });
      return branch;
    }),
    create: adminProcedure.input(z.object({
      companyId: z.number(),
      name: z.string().min(1),
      code: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      managerId: z.number().optional(),
      isHeadquarters: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createBranch(input);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "created", entityType: "branch", entityId: id, entityLabel: input.name });
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      code: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      managerId: z.number().nullable().optional(),
      isHeadquarters: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateBranch(id, data);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "updated", entityType: "branch", entityId: id, entityLabel: data.name });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteBranch(input.id);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "deleted", entityType: "branch", entityId: input.id });
      return { success: true };
    }),
  }),

  // ── DEPARTMENTS ───────────────────────────────────────────────────────────
  departments: router({
    list: protectedProcedure.input(z.object({ branchId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getDepartments(input?.branchId);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const dept = await db.getDepartmentById(input.id);
      if (!dept) throw new TRPCError({ code: "NOT_FOUND" });
      return dept;
    }),
    create: adminProcedure.input(z.object({
      branchId: z.number(),
      name: z.string().min(1),
      code: z.string().optional(),
      description: z.string().optional(),
      managerId: z.number().optional(),
      parentDepartmentId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createDepartment(input);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "created", entityType: "department", entityId: id, entityLabel: input.name });
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      code: z.string().optional(),
      description: z.string().optional(),
      managerId: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateDepartment(id, data);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "updated", entityType: "department", entityId: id, entityLabel: data.name });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteDepartment(input.id);
      await db.logActivity({ userId: ctx.user.id, module: "organization", action: "deleted", entityType: "department", entityId: input.id });
      return { success: true };
    }),
  }),

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional(), ownerId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getProjects(input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const project = await db.getProjectById(input.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),
    create: protectedProcedure.input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      branchId: z.number().optional(),
      departmentId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      budget: z.string().optional(),
      currency: z.string().optional(),
      objectives: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createProject({ ...input, ownerId: ctx.user.id });
      await db.logActivity({ userId: ctx.user.id, module: "projects", action: "created", entityType: "project", entityId: id, entityLabel: input.name });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      branchId: z.number().nullable().optional(),
      departmentId: z.number().nullable().optional(),
      startDate: z.date().nullable().optional(),
      endDate: z.date().nullable().optional(),
      budget: z.string().nullable().optional(),
      objectives: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateProject(id, data);
      await db.logActivity({ userId: ctx.user.id, module: "projects", action: "updated", entityType: "project", entityId: id, entityLabel: data.name });
      return { success: true };
    }),
    delete: managerOrAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteProject(input.id);
      await db.logActivity({ userId: ctx.user.id, module: "projects", action: "deleted", entityType: "project", entityId: input.id });
      return { success: true };
    }),
    getTeam: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getProjectTeamMembers(input.projectId);
    }),
    addTeamMember: protectedProcedure.input(z.object({ projectId: z.number(), userId: z.number(), role: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const id = await db.addProjectTeamMember(input);
      await db.logActivity({ userId: ctx.user.id, module: "projects", action: "team_member_added", entityType: "project_team", entityId: id });
      return { id };
    }),
    removeTeamMember: protectedProcedure.input(z.object({ projectId: z.number(), userId: z.number() })).mutation(async ({ input, ctx }) => {
      await db.removeProjectTeamMember(input.projectId, input.userId);
      await db.logActivity({ userId: ctx.user.id, module: "projects", action: "team_member_removed", entityType: "project_team", entityId: input.projectId });
      return { success: true };
    }),
  }),

  // ── SUPPLIERS ─────────────────────────────────────────────────────────────
  suppliers: router({
    categories: router({
      list: protectedProcedure.query(async () => db.getSupplierCategories()),
      create: adminProcedure.input(z.object({ name: z.string().min(1), description: z.string().optional() })).mutation(async ({ input, ctx }) => {
        const id = await db.createSupplierCategory(input);
        await db.logActivity({ userId: ctx.user.id, module: "suppliers", action: "created", entityType: "supplier_category", entityId: id, entityLabel: input.name });
        return { id };
      }),
      update: adminProcedure.input(z.object({ id: z.number(), name: z.string().min(1).optional(), description: z.string().optional() })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSupplierCategory(id, data);
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteSupplierCategory(input.id);
        return { success: true };
      }),
    }),
    list: protectedProcedure.input(z.object({ categoryId: z.number().optional(), status: z.string().optional(), search: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.getSuppliers(input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const supplier = await db.getSupplierById(input.id);
      if (!supplier) throw new TRPCError({ code: "NOT_FOUND" });
      return supplier;
    }),
    create: protectedProcedure.input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      nameEn: z.string().optional(),
      categoryId: z.number().optional(),
      registrationNumber: z.string().optional(),
      taxNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      rating: z.enum(["1", "2", "3", "4", "5"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createSupplier(input);
      await db.logActivity({ userId: ctx.user.id, module: "suppliers", action: "created", entityType: "supplier", entityId: id, entityLabel: input.name });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      nameEn: z.string().optional(),
      categoryId: z.number().nullable().optional(),
      registrationNumber: z.string().optional(),
      taxNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      rating: z.enum(["1", "2", "3", "4", "5"]).nullable().optional(),
      status: z.enum(["active", "inactive", "blacklisted"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateSupplier(id, data);
      await db.logActivity({ userId: ctx.user.id, module: "suppliers", action: "updated", entityType: "supplier", entityId: id, entityLabel: data.name });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteSupplier(input.id);
      await db.logActivity({ userId: ctx.user.id, module: "suppliers", action: "deleted", entityType: "supplier", entityId: input.id });
      return { success: true };
    }),
  }),

  // ── PURCHASE REQUESTS ─────────────────────────────────────────────────────
  purchaseRequests: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional(), requesterId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getPurchaseRequests(input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const pr = await db.getPurchaseRequestById(input.id);
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await db.getPurchaseRequestItems(input.id);
      return { ...pr, items };
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      departmentId: z.number().optional(),
      branchId: z.number().optional(),
      projectId: z.number().optional(),
      supplierId: z.number().optional(),
      currency: z.string().optional(),
      requiredByDate: z.date().optional(),
      items: z.array(z.object({
        itemName: z.string().min(1),
        description: z.string().optional(),
        quantity: z.string(),
        unit: z.string().optional(),
        estimatedUnitPrice: z.string().optional(),
        notes: z.string().optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      const requestNumber = await db.generateRequestNumber();
      const totalAmount = input.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.estimatedUnitPrice ?? "0") || 0;
        return sum + qty * price;
      }, 0);
      const id = await db.createPurchaseRequest({
        requestNumber,
        title: input.title,
        description: input.description,
        priority: input.priority,
        requesterId: ctx.user.id,
        departmentId: input.departmentId,
        branchId: input.branchId,
        projectId: input.projectId,
        supplierId: input.supplierId,
        currency: input.currency ?? "SAR",
        requiredByDate: input.requiredByDate,
        totalAmount: totalAmount > 0 ? String(totalAmount) : undefined,
        status: "draft",
      });
      for (const item of input.items) {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.estimatedUnitPrice ?? "0") || 0;
        await db.createPurchaseRequestItem({
          purchaseRequestId: id,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          estimatedUnitPrice: item.estimatedUnitPrice,
          estimatedTotalPrice: String(qty * price),
          notes: item.notes,
        });
      }
      await db.logActivity({ userId: ctx.user.id, module: "purchase_requests", action: "created", entityType: "purchase_request", entityId: id, entityLabel: input.title });
      return { id, requestNumber };
    }),
    submit: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const pr = await db.getPurchaseRequestById(input.id);
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      if (pr.requesterId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") throw new TRPCError({ code: "FORBIDDEN" });
      if (pr.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft requests can be submitted" });
      await db.updatePurchaseRequest(input.id, { status: "submitted", submittedAt: new Date() });
      await db.logActivity({ userId: ctx.user.id, module: "purchase_requests", action: "submitted", entityType: "purchase_request", entityId: input.id, entityLabel: pr.title });
      return { success: true };
    }),
    review: managerOrAdminProcedure.input(z.object({
      id: z.number(),
      action: z.enum(["approve", "reject"]),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const pr = await db.getPurchaseRequestById(input.id);
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      if (pr.status !== "submitted" && pr.status !== "under_review") throw new TRPCError({ code: "BAD_REQUEST", message: "Request must be submitted before review" });
      const newStatus = input.action === "approve" ? "approved" : "rejected";
      await db.updatePurchaseRequest(input.id, { status: newStatus, reviewedAt: new Date(), reviewedById: ctx.user.id, reviewNotes: input.notes });
      await db.logActivity({ userId: ctx.user.id, module: "purchase_requests", action: input.action === "approve" ? "approved" : "rejected", entityType: "purchase_request", entityId: input.id, entityLabel: pr.title });
      return { success: true };
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const pr = await db.getPurchaseRequestById(input.id);
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      if (pr.requesterId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (["approved", "fulfilled", "cancelled"].includes(pr.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel this request" });
      await db.updatePurchaseRequest(input.id, { status: "cancelled" });
      await db.logActivity({ userId: ctx.user.id, module: "purchase_requests", action: "cancelled", entityType: "purchase_request", entityId: input.id, entityLabel: pr.title });
      return { success: true };
    }),
  }),

  // ── GOVERNANCE ────────────────────────────────────────────────────────────
  governance: router({
    reviews: router({
      list: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ input }) => {
        return db.getArchitectureReviews(input);
      }),
      getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const review = await db.getArchitectureReviewById(input.id);
        if (!review) throw new TRPCError({ code: "NOT_FOUND" });
        return review;
      }),
      create: protectedProcedure.input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        reviewType: z.enum(["architecture_alignment", "design_review", "implementation_review", "compliance_review", "post_implementation"]),
        scope: z.string().optional(),
        scheduledDate: z.date().optional(),
        neafVersion: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const reviewId = await db.generateReviewId();
        const id = await db.createArchitectureReview({ ...input, reviewId, reviewerId: ctx.user.id });
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "created", entityType: "architecture_review", entityId: id, entityLabel: input.title });
        return { id, reviewId };
      }),
      update: protectedProcedure.input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
        outcome: z.enum(["pass", "conditional_pass", "fail", "deferred"]).nullable().optional(),
        scope: z.string().optional(),
        findings: z.string().optional(),
        recommendations: z.string().optional(),
        scheduledDate: z.date().nullable().optional(),
        completedDate: z.date().nullable().optional(),
      })).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateArchitectureReview(id, data);
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "updated", entityType: "architecture_review", entityId: id, entityLabel: data.title });
        return { success: true };
      }),
    }),

    decisions: router({
      list: protectedProcedure.input(z.object({ status: z.string().optional(), category: z.string().optional() }).optional()).query(async ({ input }) => {
        return db.getArchitectureDecisions(input);
      }),
      getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const decision = await db.getArchitectureDecisionById(input.id);
        if (!decision) throw new TRPCError({ code: "NOT_FOUND" });
        return decision;
      }),
      create: protectedProcedure.input(z.object({
        title: z.string().min(1),
        category: z.enum(["technology", "process", "data", "security", "integration", "governance", "infrastructure"]),
        problemStatement: z.string().optional(),
        decisionStatement: z.string().optional(),
        rationale: z.string().optional(),
        alternatives: z.string().optional(),
        implications: z.string().optional(),
        constraints: z.string().optional(),
        reviewId: z.number().optional(),
        neafRevision: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const decisionId = await db.generateDecisionId();
        const id = await db.createArchitectureDecision({ ...input, decisionId, ownerId: ctx.user.id });
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "created", entityType: "architecture_decision", entityId: id, entityLabel: input.title });
        return { id, decisionId };
      }),
      update: protectedProcedure.input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        status: z.enum(["proposed", "under_review", "approved", "deprecated", "superseded"]).optional(),
        category: z.enum(["technology", "process", "data", "security", "integration", "governance", "infrastructure"]).optional(),
        problemStatement: z.string().optional(),
        decisionStatement: z.string().optional(),
        rationale: z.string().optional(),
        alternatives: z.string().optional(),
        implications: z.string().optional(),
        constraints: z.string().optional(),
        reviewId: z.number().nullable().optional(),
        approvedAt: z.date().nullable().optional(),
        neafRevision: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        if (data.status === "approved" && !data.approvedAt) data.approvedAt = new Date();
        await db.updateArchitectureDecision(id, data);
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "updated", entityType: "architecture_decision", entityId: id, entityLabel: data.title });
        return { success: true };
      }),
    }),

    traceability: router({
      list: protectedProcedure.input(z.object({ decisionId: z.number().optional(), reviewId: z.number().optional() }).optional()).query(async ({ input }) => {
        return db.getTraceabilityLinks(input);
      }),
      create: protectedProcedure.input(z.object({
        decisionId: z.number(),
        reviewId: z.number(),
        linkType: z.enum(["originated_from", "validated_by", "superseded_by", "related_to"]),
        notes: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const id = await db.createTraceabilityLink(input);
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "linked", entityType: "traceability", entityId: id });
        return { id };
      }),
      delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
        await db.deleteTraceabilityLink(input.id);
        await db.logActivity({ userId: ctx.user.id, module: "governance", action: "unlinked", entityType: "traceability", entityId: input.id });
        return { success: true };
      }),
    }),
  }),

  // ── CONTROL TOWER ─────────────────────────────────────────────────────────
  controlTower: router({
    stats: protectedProcedure.query(async () => {
      return db.getControlTowerStats();
    }),
    activity: protectedProcedure.input(z.object({ limit: z.number().min(1).max(100).optional() }).optional()).query(async ({ input }) => {
      return db.getRecentActivity(input?.limit ?? 50);
    }),
  }),

  // ── SMART INTAKE & OCR / VOICE LEDGER DRAFTS ────────────────────────────────
  smartIntake: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.getSmartIntakeDrafts(input?.status);
    }),
    createDraft: protectedProcedure.input(z.object({
      sourceType: z.enum(["ocr", "voice_command", "whatsapp"]),
      title: z.string().min(1),
      intent: z.string(),
      vendorName: z.string().optional(),
      amount: z.string().optional(),
      currency: z.string().default("EGP"),
      documentDate: z.string().optional(),
      referenceNo: z.string().optional(),
      taxNo: z.string().optional(),
      rawContent: z.string(),
      confidence: z.string().optional(),
      metadata: z.any().optional(),
    })).mutation(async ({ input, ctx }) => {
      const draftId = await db.createSmartIntakeDraft({
        sourceType: input.sourceType,
        title: input.title,
        intent: input.intent,
        vendorName: input.vendorName ?? null,
        amount: input.amount ? String(input.amount) : null,
        currency: input.currency,
        documentDate: input.documentDate ?? null,
        referenceNo: input.referenceNo ?? null,
        taxNo: input.taxNo ?? null,
        rawContent: input.rawContent,
        confidence: input.confidence ? String(input.confidence) : null,
        status: "pending_review",
      });
      await db.logActivity({
        userId: ctx.user.id,
        module: "smart_intake",
        action: "draft_created",
        entityType: "smart_intake_draft",
        entityId: draftId,
        entityLabel: input.title,
      });
      return { id: draftId };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending_review", "approved", "rejected", "posted_to_ledger"]),
    })).mutation(async ({ input, ctx }) => {
      await db.updateSmartIntakeDraftStatus(input.id, input.status, ctx.user.id);
      await db.logActivity({
        userId: ctx.user.id,
        module: "smart_intake",
        action: `status_changed_${input.status}`,
        entityType: "smart_intake_draft",
        entityId: input.id,
      });
      return { success: true };
    }),
  }),

  // ── ERD SCHEMA & FOREIGN KEY MANAGEMENT ─────────────────────────────────
  erdSchema: router({
    updateColumn: adminProcedure.input(z.object({
      tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      oldColumnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      newColumnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      newDataType: z.string().min(1),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (input.oldColumnName.toLowerCase() === 'id') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot alter Primary Key ID column' });
      }
      await db.updateTableColumn(input.tableName, input.oldColumnName, input.newColumnName, input.newDataType);
      await db.logActivity({
        userId: ctx.user.id,
        module: "governance",
        action: "schema_column_modified",
        entityType: "database_schema",
        entityId: 0,
        entityLabel: `Table ${input.tableName}: ${input.oldColumnName} -> ${input.newColumnName} (${input.newDataType})`,
      });
      return { success: true, message: `Successfully altered column in table ${input.tableName}` };
    }),
    addColumn: adminProcedure.input(z.object({
      tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      columnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      dataType: z.string().min(1),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.addTableColumn(input.tableName, input.columnName, input.dataType);
      await db.logActivity({
        userId: ctx.user.id,
        module: "governance",
        action: "schema_column_added",
        entityType: "database_schema",
        entityId: 0,
        entityLabel: `Table ${input.tableName}: added column ${input.columnName} (${input.dataType})`,
      });
      return { success: true, message: `Successfully added column ${input.columnName} to table ${input.tableName}` };
    }),
    dropColumn: adminProcedure.input(z.object({
      tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      columnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    })).mutation(async ({ input, ctx }) => {
      if (input.columnName.toLowerCase() === 'id' || input.columnName.toLowerCase().endsWith('id')) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot drop Primary Key or Foreign Key relationship columns securely' });
      }
      await db.dropTableColumn(input.tableName, input.columnName);
      await db.logActivity({
        userId: ctx.user.id,
        module: "governance",
        action: "schema_column_dropped",
        entityType: "database_schema",
        entityId: 0,
        entityLabel: `Table ${input.tableName}: dropped column ${input.columnName}`,
      });
      return { success: true, message: `Successfully dropped column ${input.columnName} from table ${input.tableName}` };
    }),
    addForeignKey: adminProcedure.input(z.object({
      tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      constraintName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      columnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      refTableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      refColumnName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
      onDelete: z.enum(["CASCADE", "RESTRICT", "SET NULL", "NO ACTION"]).default("CASCADE"),
    })).mutation(async ({ input, ctx }) => {
      await db.addForeignKeyConstraint(
        input.tableName,
        input.constraintName,
        input.columnName,
        input.refTableName,
        input.refColumnName,
        input.onDelete
      );
      await db.logActivity({
        userId: ctx.user.id,
        module: "governance",
        action: "foreign_key_added",
        entityType: "database_schema",
        entityId: 0,
        entityLabel: `FK Constraint ${input.constraintName}: ${input.tableName}(${input.columnName}) -> ${input.refTableName}(${input.refColumnName})`,
      });
      return { success: true, message: `Successfully created foreign key constraint ${input.constraintName}` };
    }),
  }),
});

export type AppRouter = typeof appRouter;
