import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createAssetAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  customName: z.string().max(255).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  inventoryCode: z.string().max(100).optional().nullable(),
  accessories: z.string().optional().nullable(),
  assignedDate: z.string().transform(str => new Date(str)),
  expectedReturnDate: z.string().transform(str => new Date(str)).optional().nullable(),
  valueAtAssignment: z.number().optional().nullable(),
  amortizationPeriodMonths: z.number().optional().nullable(),
  conditionOnIssue: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    let query = db
      .selectFrom("employee_assets")
      .leftJoin("employees", "employees.id", "employee_assets.employee_id")
      .leftJoin("inventory_items", "inventory_items.id", "employee_assets.inventory_item_id")
      .selectAll("employee_assets")
      .select([
        "employees.name as employee_name",
        "employees.surname as employee_surname",
        "employees.matriculation_number",
        "inventory_items.name as item_name",
        "inventory_items.category as item_category",
        "inventory_items.brand as item_brand"
      ]);
    
    if (employeeId) {
      query = query.where("employee_assets.employee_id", "=", employeeId);
    }

    // Only show non-returned assets by default
    query = query.where("employee_assets.is_returned", "=", false);

    const assets = await query
      .orderBy("employee_assets.assigned_date", "desc")
      .execute();

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAssetAssignmentSchema.parse(body);

    // Calculate amortization end date if period is provided
    let amortizationEndDate = null;
    if (validated.amortizationPeriodMonths) {
      amortizationEndDate = new Date(validated.assignedDate);
      amortizationEndDate.setMonth(amortizationEndDate.getMonth() + validated.amortizationPeriodMonths);
    }

    const result = await db
      .insertInto("employee_assets")
      .values({
        employee_id: validated.employeeId,
        inventory_item_id: validated.inventoryItemId,
        custom_name: validated.customName,
        serial_number: validated.serialNumber,
        inventory_code: validated.inventoryCode,
        accessories: validated.accessories,
        assigned_date: validated.assignedDate,
        expected_return_date: validated.expectedReturnDate,
        value_at_assignment: validated.valueAtAssignment,
        amortization_period_months: validated.amortizationPeriodMonths,
        amortization_end_date: amortizationEndDate,
        condition_on_issue: validated.conditionOnIssue,
        notes: validated.notes,
        created_by: session.user.id
      })
      .returningAll()
      .executeTakeFirst();

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create asset assignment:", error);
    return NextResponse.json(
      { error: "Failed to create asset assignment" },
      { status: 500 }
    );
  }
}