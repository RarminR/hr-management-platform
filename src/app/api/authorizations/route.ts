import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createAuthorizationSchema = z.object({
  employeeId: z.string().uuid(),
  authorizationType: z.enum(['crane', 'forklift', 'nacelle', 'load_binder', 'transport_license', 'other']),
  customTypeName: z.string().max(255).optional().nullable(),
  authorizationNumber: z.string().max(100).optional().nullable(),
  issuedBy: z.string().max(255).optional().nullable(),
  issuedDate: z.string().transform(str => new Date(str)),
  expiryDate: z.string().transform(str => new Date(str)),
  isSuspended: z.boolean().default(false),
  suspensionReason: z.string().optional().nullable(),
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
      .selectFrom("authorizations")
      .innerJoin("employees", "employees.id", "authorizations.employee_id")
      .select([
        "authorizations.id",
        "authorizations.employee_id",
        "authorizations.authorization_type",
        "authorizations.custom_type_name",
        "authorizations.authorization_number",
        "authorizations.issued_by",
        "authorizations.issued_date",
        "authorizations.expiry_date",
        "authorizations.is_suspended",
        "authorizations.suspension_reason",
        "authorizations.notes",
        "employees.name",
        "employees.surname",
        "employees.matriculation_number"
      ]);
    
    if (employeeId) {
      query = query.where("authorizations.employee_id", "=", employeeId);
    }

    const authorizations = await query
      .orderBy("authorizations.expiry_date", "asc")
      .execute();

    return NextResponse.json(authorizations);
  } catch (error) {
    console.error("Failed to fetch authorizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch authorizations" },
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
    const validated = createAuthorizationSchema.parse(body);

    const result = await db
      .insertInto("authorizations")
      .values({
        employee_id: validated.employeeId,
        authorization_type: validated.authorizationType,
        custom_type_name: validated.customTypeName,
        authorization_number: validated.authorizationNumber,
        issued_by: validated.issuedBy,
        issued_date: validated.issuedDate,
        expiry_date: validated.expiryDate,
        is_suspended: validated.isSuspended,
        suspension_reason: validated.suspensionReason,
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
    console.error("Failed to create authorization:", error);
    return NextResponse.json(
      { error: "Failed to create authorization" },
      { status: 500 }
    );
  }
}