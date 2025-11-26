import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createStudySchema = z.object({
  employeeId: z.string().uuid(),
  studyType: z.enum(['primary', 'secondary', 'high_school', 'vocational', 'bachelor', 'master', 'doctorate', 'certification', 'other']),
  institution: z.string().min(1).max(255),
  specialization: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  country: z.string().max(255).default('Romania'),
  startDate: z.string().transform(str => new Date(str)).optional().nullable(),
  endDate: z.string().transform(str => new Date(str)).optional().nullable(),
  hasDiploma: z.boolean().default(false),
  diplomaSeries: z.string().max(50).optional().nullable(),
  diplomaNumber: z.string().max(100).optional().nullable(),
  diplomaDate: z.string().transform(str => new Date(str)).optional().nullable(),
  isQualificationAtHire: z.boolean().default(false),
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

    let query = db.selectFrom("studies");
    
    if (employeeId) {
      query = query.where("employee_id", "=", employeeId);
    }

    const studies = await query
      .orderBy("start_date", "desc")
      .execute();

    return NextResponse.json(studies);
  } catch (error) {
    console.error("Failed to fetch studies:", error);
    return NextResponse.json(
      { error: "Failed to fetch studies" },
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
    const validated = createStudySchema.parse(body);

    const result = await db
      .insertInto("studies")
      .values({
        employee_id: validated.employeeId,
        study_type: validated.studyType,
        institution: validated.institution,
        specialization: validated.specialization,
        city: validated.city,
        country: validated.country,
        start_date: validated.startDate,
        end_date: validated.endDate,
        has_diploma: validated.hasDiploma,
        diploma_series: validated.diplomaSeries,
        diploma_number: validated.diplomaNumber,
        diploma_date: validated.diplomaDate,
        is_qualification_at_hire: validated.isQualificationAtHire,
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
    console.error("Failed to create study record:", error);
    return NextResponse.json(
      { error: "Failed to create study record" },
      { status: 500 }
    );
  }
}