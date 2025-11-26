import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createDocumentSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.string().default('employee'),
  documentType: z.enum(['id_card', 'diploma', 'certificate', 'medical_report', 'warning_document', 'authorization', 'driving_license', 'contract', 'other']),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
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

    const documents = await db
      .selectFrom("documents")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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
    const validated = createDocumentSchema.parse(body);

    const result = await db
      .insertInto("documents")
      .values({
        entity_id: validated.entityId,
        entity_type: validated.entityType,
        document_type: validated.documentType,
        file_name: validated.fileName,
        file_path: validated.filePath,
        file_size: validated.fileSize,
        mime_type: validated.mimeType,
        notes: validated.notes,
        uploaded_by: session.user.id ?? null
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
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}