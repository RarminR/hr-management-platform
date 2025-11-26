import { db } from '@/lib/db/client';
import { 
  Employee, 
  NewEmployee, 
  EmployeeUpdate,
  EmergencyContact,
  NewEmergencyContact,
  EmployeeChild,
  NewEmployeeChild
} from '@/lib/db/types';
import { generateMatriculationNumber } from '@/lib/utils/matriculation';
import { parseCNP } from '@/lib/utils/cnp-parser';

export class EmployeesService {
  /**
   * Create a new employee
   */
  async createEmployee(data: Omit<NewEmployee, 'matriculation_number' | 'date_of_birth' | 'sex'>): Promise<Employee> {
    // Parse CNP to extract date of birth and sex
    const cnpInfo = parseCNP(data.cnp);
    
    if (!cnpInfo.isValid) {
      throw new Error(`Invalid CNP: ${cnpInfo.error}`);
    }

    // Get department code for matriculation number
    let departmentCode = 'GEN'; // Default code
    
    if (data.department_id) {
      const department = await db
        .selectFrom('departments')
        .select('code')
        .where('id', '=', data.department_id)
        .executeTakeFirst();
      
      if (department) {
        departmentCode = department.code;
      }
    }

    // Generate matriculation number
    const matriculationNumber = await generateMatriculationNumber(departmentCode);

    // Create employee
    const employee = await db
      .insertInto('employees')
      .values({
        ...data,
        matriculation_number: matriculationNumber,
        date_of_birth: cnpInfo.dateOfBirth!,
        sex: cnpInfo.sex!,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return employee;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | undefined> {
    console.log('Querying employee with ID:', id);
    const result = await db
      .selectFrom('employees')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    console.log('Query result:', result ? 'Found employee' : 'No employee found');
    return result;
  }

  /**
   * Get employee by CNP
   */
  async getEmployeeByCNP(cnp: string): Promise<Employee | undefined> {
    return await db
      .selectFrom('employees')
      .selectAll()
      .where('cnp', '=', cnp)
      .executeTakeFirst();
  }

  /**
   * Get employee by matriculation number
   */
  async getEmployeeByMatriculation(matriculationNumber: string): Promise<Employee | undefined> {
    return await db
      .selectFrom('employees')
      .selectAll()
      .where('matriculation_number', '=', matriculationNumber)
      .executeTakeFirst();
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: EmployeeUpdate): Promise<Employee> {
    // If CNP is being updated, validate and extract info
    if (data.cnp) {
      const cnpInfo = parseCNP(data.cnp);
      
      if (!cnpInfo.isValid) {
        throw new Error(`Invalid CNP: ${cnpInfo.error}`);
      }

      data.date_of_birth = cnpInfo.dateOfBirth;
      data.sex = cnpInfo.sex;
    }

    const employee = await db
      .updateTable('employees')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return employee;
  }

  /**
   * List employees with pagination and filters
   */
  async listEmployees(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ employees: Employee[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = db.selectFrom('employees');
    let countQuery = db.selectFrom('employees');

    // Apply filters
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      query = query.where((eb: any) =>
        eb.or([
          eb('name', 'ilike', searchTerm),
          eb('surname', 'ilike', searchTerm),
          eb('cnp', 'like', searchTerm),
          eb('matriculation_number', 'like', searchTerm),
          eb('email', 'ilike', searchTerm),
        ])
      );
      countQuery = countQuery.where((eb: any) =>
        eb.or([
          eb('name', 'ilike', searchTerm),
          eb('surname', 'ilike', searchTerm),
          eb('cnp', 'like', searchTerm),
          eb('matriculation_number', 'like', searchTerm),
          eb('email', 'ilike', searchTerm),
        ])
      );
    }

    if (params.departmentId) {
      query = query.where('department_id', '=', params.departmentId);
      countQuery = countQuery.where('department_id', '=', params.departmentId);
    }

    if (params.status) {
      query = query.where('employment_status', '=', params.status as any);
      countQuery = countQuery.where('employment_status', '=', params.status as any);
    }

    // Get total count
    const countResult = await countQuery
      .select((eb: any) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow() as { count: bigint };

    // Apply sorting
    const sortBy = params.sortBy || 'surname';
    const sortOrder = params.sortOrder || 'asc';
    query = query.orderBy(sortBy as any, sortOrder);

    // Apply pagination
    const employees = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      employees,
      total: Number(countResult.count),
    };
  }

  /**
   * Get employee with all related data
   */
  async getEmployeeFullProfile(id: string): Promise<{
    employee: Employee;
    emergencyContacts: EmergencyContact[];
    children: EmployeeChild[];
    department?: any;
  }> {
    console.log('Getting employee profile for ID:', id);
    const employee = await this.getEmployeeById(id);
    
    if (!employee) {
      console.error('Employee not found for ID:', id);
      throw new Error(`Employee not found for ID: ${id}`);
    }

    const [emergencyContacts, children] = await Promise.all([
      db
        .selectFrom('emergency_contacts')
        .selectAll()
        .where('employee_id', '=', id)
        .orderBy('is_primary', 'desc')
        .execute(),
      db
        .selectFrom('employee_children')
        .selectAll()
        .where('employee_id', '=', id)
        .orderBy('date_of_birth', 'asc')
        .execute(),
    ]);

    let department;
    if (employee.department_id) {
      department = await db
        .selectFrom('departments')
        .selectAll()
        .where('id', '=', employee.department_id)
        .executeTakeFirst();
    }

    return {
      employee,
      emergencyContacts,
      children,
      department,
    };
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(employeeId: string, data: Omit<NewEmergencyContact, 'employee_id'>): Promise<EmergencyContact> {
    // If this is marked as primary, unmark others
    if (data.is_primary) {
      await db
        .updateTable('emergency_contacts')
        .set({ is_primary: false })
        .where('employee_id', '=', employeeId)
        .execute();
    }

    return await db
      .insertInto('emergency_contacts')
      .values({
        ...data,
        employee_id: employeeId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(id: string, data: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const contact = await db
      .selectFrom('emergency_contacts')
      .select('employee_id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!contact) {
      throw new Error('Emergency contact not found');
    }

    // If this is marked as primary, unmark others
    if (data.is_primary) {
      await db
        .updateTable('emergency_contacts')
        .set({ is_primary: false })
        .where('employee_id', '=', contact.employee_id)
        .where('id', '!=', id)
        .execute();
    }

    return await db
      .updateTable('emergency_contacts')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(id: string): Promise<void> {
    await db
      .deleteFrom('emergency_contacts')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Add child
   */
  async addChild(employeeId: string, data: Omit<NewEmployeeChild, 'employee_id'>): Promise<EmployeeChild> {
    // If CNP is provided, validate and extract date of birth
    if (data.cnp) {
      const cnpInfo = parseCNP(data.cnp);
      
      if (!cnpInfo.isValid) {
        throw new Error(`Invalid child CNP: ${cnpInfo.error}`);
      }

      if (!data.date_of_birth) {
        data.date_of_birth = cnpInfo.dateOfBirth;
      }
    }

    return await db
      .insertInto('employee_children')
      .values({
        ...data,
        employee_id: employeeId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Update child
   */
  async updateChild(id: string, data: Partial<EmployeeChild>): Promise<EmployeeChild> {
    // If CNP is being updated, validate and extract date of birth
    if (data.cnp) {
      const cnpInfo = parseCNP(data.cnp);
      
      if (!cnpInfo.isValid) {
        throw new Error(`Invalid child CNP: ${cnpInfo.error}`);
      }

      data.date_of_birth = cnpInfo.dateOfBirth;
    }

    return await db
      .updateTable('employee_children')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete child
   */
  async deleteChild(id: string): Promise<void> {
    await db
      .deleteFrom('employee_children')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    return await db
      .selectFrom('employees')
      .selectAll()
      .where('department_id', '=', departmentId)
      .where('employment_status', '=', 'active')
      .orderBy('surname', 'asc')
      .orderBy('name', 'asc')
      .execute();
  }

  /**
   * Search employees
   */
  async searchEmployees(query: string, limit = 10): Promise<Employee[]> {
    const searchTerm = `%${query}%`;
    
    return await db
      .selectFrom('employees')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('name', 'ilike', searchTerm),
          eb('surname', 'ilike', searchTerm),
          eb('cnp', 'like', searchTerm),
          eb('matriculation_number', 'like', searchTerm),
          eb('email', 'ilike', searchTerm),
        ])
      )
      .limit(limit)
      .execute();
  }

  /**
   * Terminate employee
   */
  async terminateEmployee(id: string, terminationDate: Date = new Date()): Promise<Employee> {
    return await db
      .updateTable('employees')
      .set({
        employment_status: 'terminated',
        termination_date: terminationDate,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Reactivate employee
   */
  async reactivateEmployee(id: string): Promise<Employee> {
    return await db
      .updateTable('employees')
      .set({
        employment_status: 'active',
        termination_date: null,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

// Export singleton instance
export const employeesService = new EmployeesService();