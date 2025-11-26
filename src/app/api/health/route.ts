import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createHealthVisitSchema = z.object({
  employeeId: z.string().uuid(),
  visitType: z.enum(['hiring', 'periodic', 'change_of_role', 'return_to_work']),
  scheduledDate: z.string().transform(str => new Date(str)),
  performedDate: z.string().transform(str => new Date(str)).optional().nullable(),
  medicalProvider: z.string().max(255).optional().nullable(),
  doctorName: z.string().max(255).optional().nullable(),
  fitnessResult: z.enum(['fit', 'conditional', 'unfit']).optional().nullable(),
  restrictions: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  nextVisitDate: z.string().transform(str => new Date(str)).optional().nullable(),
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
      .selectFrom("occupational_health_visits")
      .innerJoin("employees", "employees.id", "occupational_health_visits.employee_id")
      .selectAll("occupational_health_visits")
      .select([
        "employees.name",
        "employees.surname",
        "employees.matriculation_number"
      ]);
    
    if (employeeId) {
      query = query.where("occupational_health_visits.employee_id", "=", employeeId);
    }

    const visits = await query
      .orderBy("occupational_health_visits.scheduled_date", "desc")
      .execute();

    return NextResponse.json(visits);
  } catch (error) {
    console.error("Failed to fetch health visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch health visits" },
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
    const validated = createHealthVisitSchema.parse(body);

    const result = await db
      .insertInto("occupational_health_visits")
      .values({
        employee_id: validated.employeeId,
        visit_type: validated.visitType,
        scheduled_date: validated.scheduledDate,
        performed_date: validated.performedDate,
        medical_provider: validated.medicalProvider,
        doctor_name: validated.doctorName,
        fitness_result: validated.fitnessResult,
        restrictions: validated.restrictions,
        recommendations: validated.recommendations,
        next_visit_date: validated.nextVisitDate,
        notes: validated.notes
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
    console.error("Failed to create health visit:", error);
    return NextResponse.json(
      { error: "Failed to create health visit" },
      { status: 500 }
    );
  }
}