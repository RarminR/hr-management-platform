import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { employeesService } from '@/server/services/employees.service';
import { z } from 'zod';

// GET /api/employees/:id - Get employee details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await employeesService.getEmployeeFullProfile(params.id);
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Log sensitive data access
    await logAudit(session.user.id, 'read', 'employees', params.id);

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/:id - Update employee
const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
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
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  spouse_name: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  employment_status: z.enum(['active', 'inactive', 'terminated', 'suspended', 'on_leave']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'hr'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    // Get old values for audit
    const oldEmployee = await employeesService.getEmployeeById(params.id);
    
    const employee = await employeesService.updateEmployee(params.id, {
      ...validatedData,
      updated_by: session.user.id,
    });

    // Log audit
    await logAudit(session.user.id, 'update', 'employees', params.id, oldEmployee, employee);

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/:id - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await employeesService.getEmployeeById(params.id);
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete by setting status to terminated
    await employeesService.terminateEmployee(params.id);

    // Log audit
    await logAudit(session.user.id, 'delete', 'employees', params.id, employee, null);

    return NextResponse.json({ message: 'Employee terminated successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
  oldValues?: any,
  newValues?: any
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
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
      })
      .execute();
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}