import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createHousingSchema = z.object({
  employeeId: z.string().uuid(),
  address: z.string().min(1).max(500),
  housingType: z.string().max(100).optional().nullable(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional().nullable(),
  monthlyRent: z.number().optional().nullable(),
  utilitiesIncluded: z.boolean().default(false),
  depositAmount: z.number().optional().nullable(),
  depositReturned: z.boolean().default(false),
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
    const activeOnly = searchParams.get('active') === 'true';

    let query = db
      .selectFrom("employee_housing")
      .innerJoin("employees", "employees.id", "employee_housing.employee_id")
      .selectAll("employee_housing")
      .select([
        "employees.name",
        "employees.surname",
        "employees.matriculation_number"
      ]);
    
    if (employeeId) {
      query = query.where("employee_housing.employee_id", "=", employeeId);
    }

    if (activeOnly) {
      query = query.where("employee_housing.is_active", "=", true);
    }

    const housing = await query
      .orderBy("employee_housing.start_date", "desc")
      .execute();

    return NextResponse.json(housing);
  } catch (error) {
    console.error("Failed to fetch housing:", error);
    return NextResponse.json(
      { error: "Failed to fetch housing records" },
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
    const validated = createHousingSchema.parse(body);

    const result = await db
      .insertInto("employee_housing")
      .values({
        employee_id: validated.employeeId,
        address: validated.address,
        housing_type: validated.housingType,
        start_date: validated.startDate,
        end_date: validated.endDate,
        monthly_rent: validated.monthlyRent,
        utilities_included: validated.utilitiesIncluded,
        deposit_amount: validated.depositAmount,
        deposit_returned: validated.depositReturned,
        notes: validated.notes,
        is_active: validated.endDate ? new Date(validated.endDate) > new Date() : true
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
    console.error("Failed to create housing record:", error);
    return NextResponse.json(
      { error: "Failed to create housing record" },
      { status: 500 }
    );
  }
}