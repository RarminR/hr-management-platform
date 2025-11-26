import { db } from '@/lib/db/client';
import { Department, NewDepartment, DepartmentUpdate } from '@/lib/db/types';

export class DepartmentsService {
  /**
   * Create a new department
   */
  async createDepartment(data: NewDepartment): Promise<Department> {
    // Check if code already exists
    const existing = await db
      .selectFrom('departments')
      .select('id')
      .where('code', '=', data.code)
      .executeTakeFirst();

    if (existing) {
      throw new Error(`Department with code ${data.code} already exists`);
    }

    return await db
      .insertInto('departments')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<Department | undefined> {
    return await db
      .selectFrom('departments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Get department by code
   */
  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    return await db
      .selectFrom('departments')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: DepartmentUpdate): Promise<Department> {
    // If code is being updated, check if it already exists
    if (data.code) {
      const existing = await db
        .selectFrom('departments')
        .select('id')
        .where('code', '=', data.code)
        .where('id', '!=', id)
        .executeTakeFirst();

      if (existing) {
        throw new Error(`Department with code ${data.code} already exists`);
      }
    }

    return await db
      .updateTable('departments')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string): Promise<void> {
    // Check if department has employees
    const hasEmployees = await db
      .selectFrom('employees')
      .select('id')
      .where('department_id', '=', id)
      .limit(1)
      .executeTakeFirst();

    if (hasEmployees) {
      throw new Error('Cannot delete department with assigned employees');
    }

    // Check if department has child departments
    const hasChildren = await db
      .selectFrom('departments')
      .select('id')
      .where('parent_id', '=', id)
      .limit(1)
      .executeTakeFirst();

    if (hasChildren) {
      throw new Error('Cannot delete department with child departments');
    }

    await db
      .deleteFrom('departments')
      .where('id', '=', id)
      .execute();
  }

  /**
   * List all departments
   */
  async listDepartments(): Promise<Department[]> {
    let query = db
      .selectFrom('departments')
      .selectAll()
      .orderBy('name', 'asc');

    return await query.execute();
  }

  /**
   * Get department hierarchy
   */
  async getDepartmentHierarchy(): Promise<Department[]> {
    const departments = await this.listDepartments();
    return this.buildHierarchy(departments, null);
  }

  private buildHierarchy(departments: Department[], parentId: string | null): Department[] {
    return departments
      .filter(d => d.parent_id === parentId)
      .map(d => ({
        ...d,
        children: this.buildHierarchy(departments, d.id),
      } as any));
  }

  /**
   * Get department with employee count
   */
  async getDepartmentsWithStats(): Promise<Array<Department & { employee_count: number }>> {
    const result = await db
      .selectFrom('departments as d')
      .leftJoin('employees as e', (join) =>
        join
          .onRef('e.department_id', '=', 'd.id')
          .on('e.employment_status', '=', 'active')
      )
      .select([
        'd.id',
        'd.code',
        'd.name',
        'd.description',
        'd.parent_id',
        'd.created_at',
        'd.updated_at',
      ])
      .select((eb: any) => eb.fn.count('e.id').as('employee_count'))
      .groupBy([
        'd.id',
        'd.code',
        'd.name',
        'd.description',
        'd.parent_id',
        'd.created_at',
        'd.updated_at',
      ])
      .execute();

    return result.map((r: any) => ({
      ...r,
      employee_count: Number(r.employee_count),
    }));
  }
}

export const departmentsService = new DepartmentsService();