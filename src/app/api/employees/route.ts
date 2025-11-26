import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { employeesService } from '@/server/services/employees.service';
import { z } from 'zod';

// GET /api/employees - List employees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    const result = await employeesService.listEmployees({
      page,
      limit,
      search,
      departmentId,
      status,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create employee
const createEmployeeSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  cnp: z.string().length(13),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_block: z.string().optional().nullable(),
  address_staircase: z.string().optional().nullable(),
  address_floor: z.string().optional().nullable(),
  address_apartment: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_county: z.string().optional().nullable(),
  id_series: z.string().optional().nullable(),
  id_number: z.string().optional().nullable(),
  id_issued_date: z.string().optional().nullable(),
  id_issuer: z.string().optional().nullable(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  spouse_name: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  photo_path: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'hr'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Clean up empty strings to null
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );
    
    const validatedData = createEmployeeSchema.parse(cleanedBody);

    // Convert date strings to Date objects
    const data = {
      ...validatedData,
      id_issued_date: validatedData.id_issued_date 
        ? new Date(validatedData.id_issued_date) 
        : null,
      hire_date: validatedData.hire_date 
        ? new Date(validatedData.hire_date) 
        : null,
      created_by: session.user.id,
    };

    const employee = await employeesService.createEmployee(data);

    // Log audit
    await logAudit(session.user.id, 'create', 'employees', employee.id, null, employee);

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating employee:', error);
    
    // Check for specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid CNP')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to log audit
async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues: any,
  newValues: any
) {
  try {
    const { db } = await import('@/lib/db/client');
    await db
      .insertInto('audit_logs')
      .values({
        user_id: userId,
        action: action as any,
        entity_type: entityType,
        entity_id: entityId,
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(newValues),
      })
      .execute();
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}