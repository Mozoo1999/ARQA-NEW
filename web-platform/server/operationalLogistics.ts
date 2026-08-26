import { and, eq, like, or } from "drizzle-orm";
import {
  customers,
  InsertReceivingNote,
  InsertVehicleLoadDraft,
  materialTypes,
  operationalInputEvents,
  receivingNoteLines,
  receivingNotes,
  vehicles,
  vehicleLoadDrafts,
  vehicleLoadLines,
} from "../drizzle/schema";
import { getDb } from "./db";

export type OperationalLoadLineInput = {
  materialTypeId?: number | null;
  materialName: string;
  quantity: string;
  unit: string;
  unitPrice?: string | null;
  totalPrice?: string | null;
};

export type OperationalLoadDraftInput = Omit<InsertVehicleLoadDraft, "id" | "createdAt" | "updatedAt"> & {
  lines: OperationalLoadLineInput[];
};

export type OperationalReceivingLineInput = {
  materialTypeId?: number | null;
  materialName: string;
  quantity: string;
  unit: string;
  unitPrice?: string | null;
};

export type OperationalReceivingNoteInput = Omit<InsertReceivingNote, "id" | "createdAt" | "updatedAt"> & {
  lines: OperationalReceivingLineInput[];
};

export async function getOperationalReferenceData() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const [customerRows, vehicleRows, materialRows] = await Promise.all([
    database.select().from(customers).where(eq(customers.status, "active")).orderBy(customers.name),
    database.select().from(vehicles).where(eq(vehicles.isActive, true)).orderBy(vehicles.plateNumber),
    database.select().from(materialTypes).where(eq(materialTypes.isActive, true)).orderBy(materialTypes.name),
  ]);
  return { customers: customerRows, vehicles: vehicleRows, materialTypes: materialRows };
}

export async function findCustomerByName(name: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database.select().from(customers).where(like(customers.name, `%${name.trim()}%`)).limit(5);
}

export async function findVehicleByPlate(plateNumber: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database.select().from(vehicles).where(like(vehicles.plateNumber, `%${plateNumber.trim()}%`)).limit(5);
}

export async function resolveCustomerAndVehicle(input: {
  customerName: string;
  customerTaxNumber?: string | null;
  vehiclePlateNumber: string;
  createMissing: boolean;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const customerName = input.customerName.trim();
  const plateNumber = input.vehiclePlateNumber.trim().toUpperCase();
  if (!customerName || !plateNumber) throw new Error("Customer name and vehicle plate number are required");
  return database.transaction(async tx => {
    const customerCandidates = input.customerTaxNumber
      ? await tx.select().from(customers).where(or(eq(customers.taxNumber, input.customerTaxNumber), eq(customers.name, customerName))).limit(2)
      : await tx.select().from(customers).where(eq(customers.name, customerName)).limit(2);
    let customer = customerCandidates[0];
    if (!customer) {
      if (!input.createMissing) throw new Error("Customer was not found; confirm creation before continuing");
      const result = await tx.insert(customers).values({ code: `CUS-${Date.now()}`, name: customerName, taxNumber: input.customerTaxNumber ?? null, status: "active" });
      const createdId = Number(result[0].insertId);
      customer = (await tx.select().from(customers).where(eq(customers.id, createdId)).limit(1))[0]!;
    }
    const vehicleCandidates = await tx.select().from(vehicles).where(eq(vehicles.plateNumber, plateNumber)).limit(1);
    let vehicle = vehicleCandidates[0];
    if (!vehicle) {
      if (!input.createMissing) throw new Error("Vehicle was not found; confirm creation before continuing");
      const result = await tx.insert(vehicles).values({ plateNumber, customerId: customer.id, isActive: true });
      const createdId = Number(result[0].insertId);
      vehicle = (await tx.select().from(vehicles).where(eq(vehicles.id, createdId)).limit(1))[0]!;
    } else if (vehicle.customerId && vehicle.customerId !== customer.id) {
      throw new Error("Vehicle is already associated with a different customer and requires manual resolution");
    } else if (!vehicle.customerId) {
      await tx.update(vehicles).set({ customerId: customer.id, updatedAt: new Date() }).where(eq(vehicles.id, vehicle.id));
      vehicle = { ...vehicle, customerId: customer.id };
    }
    return { customer, vehicle, createdCustomer: customerCandidates.length === 0, createdVehicle: vehicleCandidates.length === 0 };
  });
}

export async function createVehicleLoadDraft(input: OperationalLoadDraftInput) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database.transaction(async tx => {
    const { lines, ...draft } = input;
    const result = await tx.insert(vehicleLoadDrafts).values(draft);
    const draftId = Number(result[0].insertId);
    await tx.insert(vehicleLoadLines).values(lines.map(line => ({
      vehicleLoadDraftId: draftId,
      materialTypeId: line.materialTypeId ?? null,
      materialName: line.materialName,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice ?? null,
      totalPrice: line.totalPrice ?? null,
    })));
    return draftId;
  });
}

export async function createReceivingNote(input: OperationalReceivingNoteInput) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database.transaction(async tx => {
    const { lines, ...note } = input;
    const result = await tx.insert(receivingNotes).values(note);
    const noteId = Number(result[0].insertId);
    await tx.insert(receivingNoteLines).values(lines.map(line => ({
      receivingNoteId: noteId,
      materialTypeId: line.materialTypeId ?? null,
      materialName: line.materialName,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice ?? null,
    })));
    return noteId;
  });
}

export async function confirmVehicleLoadDraft(id: number, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(vehicleLoadDrafts).set({ status: "confirmed", confirmedByUserId: userId, confirmedAt: new Date(), updatedAt: new Date() }).where(eq(vehicleLoadDrafts.id, id));
}

export async function confirmReceivingNote(id: number, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(receivingNotes).set({ status: "confirmed", confirmedByUserId: userId, confirmedAt: new Date(), updatedAt: new Date() }).where(eq(receivingNotes.id, id));
}

export async function recordOperationalInputEvent(data: typeof operationalInputEvents.$inferInsert) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(operationalInputEvents).values(data);
  return Number(result[0].insertId);
}

export type QuantityMatchRow = { materialName: string; unit: string; quantity: string | number | null; status: string };

export function calculateUnenteredQuantities(loadRows: QuantityMatchRow[], receiptRows: QuantityMatchRow[]) {
  const totals = new Map<string, { materialName: string; unit: string; loaded: number; received: number }>();
  for (const row of loadRows) {
    if (row.status === "rejected") continue;
    const key = `${row.materialName}|${row.unit}`;
    const current = totals.get(key) ?? { materialName: row.materialName, unit: row.unit, loaded: 0, received: 0 };
    current.loaded += Number(row.quantity ?? 0);
    totals.set(key, current);
  }
  for (const row of receiptRows) {
    if (row.status === "rejected") continue;
    const key = `${row.materialName}|${row.unit}`;
    const current = totals.get(key) ?? { materialName: row.materialName, unit: row.unit, loaded: 0, received: 0 };
    current.received += Number(row.quantity ?? 0);
    totals.set(key, current);
  }
  return Array.from(totals.values()).map(item => ({ ...item, unenteredQuantity: Math.max(0, item.loaded - item.received) }));
}

export async function getVehicleQuantityMatch(customerId: number, vehicleId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const [loadRows, receiptRows] = await Promise.all([
    database.select({ materialName: vehicleLoadLines.materialName, unit: vehicleLoadLines.unit, quantity: vehicleLoadLines.quantity, status: vehicleLoadDrafts.status })
      .from(vehicleLoadLines)
      .innerJoin(vehicleLoadDrafts, eq(vehicleLoadLines.vehicleLoadDraftId, vehicleLoadDrafts.id))
      .where(and(eq(vehicleLoadDrafts.customerId, customerId), eq(vehicleLoadDrafts.vehicleId, vehicleId))),
    database.select({ materialName: receivingNoteLines.materialName, unit: receivingNoteLines.unit, quantity: receivingNoteLines.quantity, status: receivingNotes.status })
      .from(receivingNoteLines)
      .innerJoin(receivingNotes, eq(receivingNoteLines.receivingNoteId, receivingNotes.id))
      .where(and(eq(receivingNotes.customerId, customerId), eq(receivingNotes.vehicleId, vehicleId))),
  ]);
  return calculateUnenteredQuantities(loadRows, receiptRows);
}
