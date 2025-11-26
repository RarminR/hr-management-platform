import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { 
  MedicalHistory, 
  NewMedicalHistory, 
  MedicalHistoryUpdate,
  OccupationalHealthVisit,
  NewOccupationalHealthVisit,
  OccupationalHealthVisitUpdate
} from '@/lib/db/types';

export class HealthService {
  /**
   * Create or update medical history for employee
   */
  async upsertMedicalHistory(employeeId: string, data: Omit<NewMedicalHistory, 'employee_id'>): Promise<MedicalHistory> {
    // Check if medical history exists
    const existing = await db
      .selectFrom('medical_history')
      .select('id')
      .where('employee_id', '=', employeeId)
      .executeTakeFirst();

    if (existing) {
      // Update existing
      return await db
        .updateTable('medical_history')
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      // Create new
      return await db
        .insertInto('medical_history')
        .values({
          ...data,
          employee_id: employeeId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }
  }

  /**
   * Get medical history for employee
   */
  async getEmployeeMedicalHistory(employeeId: string): Promise<MedicalHistory | undefined> {
    return await db
      .selectFrom('medical_history')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .executeTakeFirst();
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(id: string, data: MedicalHistoryUpdate, updatedBy: string): Promise<MedicalHistory> {
    return await db
      .updateTable('medical_history')
      .set({
        ...data,
        updated_at: new Date(),
        updated_by: updatedBy,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete medical history
   */
  async deleteMedicalHistory(id: string): Promise<void> {
    await db
      .deleteFrom('medical_history')
      .where('id', '=', id)
      .execute();
  }

  // Occupational Health Visit Methods

  /**
   * Schedule occupational health visit
   */
  async scheduleHealthVisit(data: NewOccupationalHealthVisit): Promise<OccupationalHealthVisit> {
    return await db
      .insertInto('occupational_health_visits')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get health visit by ID
   */
  async getHealthVisitById(id: string): Promise<OccupationalHealthVisit | undefined> {
    return await db
      .selectFrom('occupational_health_visits')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update health visit
   */
  async updateHealthVisit(id: string, data: OccupationalHealthVisitUpdate): Promise<OccupationalHealthVisit> {
    return await db
      .updateTable('occupational_health_visits')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete health visit
   */
  async deleteHealthVisit(id: string): Promise<void> {
    await db
      .deleteFrom('occupational_health_visits')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all health visits for employee
   */
  async getEmployeeHealthVisits(employeeId: string): Promise<OccupationalHealthVisit[]> {
    return await db
      .selectFrom('occupational_health_visits')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('performed_date', 'desc')
      .orderBy('scheduled_date', 'desc')
      .execute();
  }

  /**
   * Get pending health visits
   */
  async getPendingHealthVisits(): Promise<OccupationalHealthVisit[]> {
    return await db
      .selectFrom('occupational_health_visits')
      .selectAll()
      .where('performed_date', 'is', null)
      .where('scheduled_date', '>=', new Date())
      .orderBy('scheduled_date', 'asc')
      .execute();
  }

  /**
   * Get upcoming health visits (next 30 days)
   */
  async getUpcomingHealthVisits(daysAhead = 30): Promise<Array<OccupationalHealthVisit & { employee_name: string }>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const result = await db
      .selectFrom('occupational_health_visits as v')
      .innerJoin('employees as e', 'e.id', 'v.employee_id')
      .selectAll('v')
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('v.scheduled_date', '<=', futureDate)
      .where('v.scheduled_date', '>=', new Date())
      .where('v.performed_date', 'is', null)
      .where('e.employment_status', '=', 'active')
      .orderBy('v.scheduled_date', 'asc')
      .execute();

    return result as any;
  }

  /**
   * Get overdue health visits
   */
  async getOverdueHealthVisits(): Promise<Array<OccupationalHealthVisit & { employee_name: string }>> {
    const result = await db
      .selectFrom('occupational_health_visits as v')
      .innerJoin('employees as e', 'e.id', 'v.employee_id')
      .selectAll('v')
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('v.next_visit_date', '<', new Date())
      .where('e.employment_status', '=', 'active')
      .orderBy('v.next_visit_date', 'asc')
      .execute();

    return result as any;
  }

  /**
   * Get employees with fitness issues
   */
  async getEmployeesWithFitnessIssues(): Promise<Array<{
    employee_id: string;
    employee_name: string;
    latest_visit: OccupationalHealthVisit;
  }>> {
    const result = await db
      .selectFrom('occupational_health_visits as v')
      .innerJoin('employees as e', 'e.id', 'v.employee_id')
      .selectAll('v')
      .select(['e.name', 'e.surname'])
      .where('v.fitness_result', 'in', ['conditional', 'unfit'])
      .where('e.employment_status', '=', 'active')
      .distinctOn('v.employee_id')
      .orderBy('v.employee_id')
      .orderBy('v.performed_date', 'desc')
      .execute();

    return result.map((r: any) => ({
      employee_id: r.employee_id,
      employee_name: `${r.name} ${r.surname}`,
      latest_visit: {
        id: r.id,
        employee_id: r.employee_id,
        scheduled_date: r.scheduled_date,
        performed_date: r.performed_date,
        visit_type: r.visit_type,
        medical_provider: r.medical_provider,
        doctor_name: r.doctor_name,
        fitness_result: r.fitness_result,
        restrictions: r.restrictions,
        recommendations: r.recommendations,
        next_visit_date: r.next_visit_date,
        document_path: r.document_path,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
        created_by: r.created_by,
      },
    }));
  }

  /**
   * Get employees with work restrictions
   */
  async getEmployeesWithRestrictions(): Promise<Array<{
    employee_id: string;
    employee_name: string;
    restrictions: string | null;
  }>> {
    const result = await db
      .selectFrom('medical_history as m')
      .innerJoin('employees as e', 'e.id', 'm.employee_id')
      .select(['m.employee_id', 'm.work_restrictions'])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('m.work_restrictions', 'is not', null)
      .where('m.work_restrictions', '!=', '')
      .where('e.employment_status', '=', 'active')
      .execute();

    return result.map((r: any) => ({
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      restrictions: r.work_restrictions,
    }));
  }

  /**
   * Mark visit as completed
   */
  async completeHealthVisit(
    id: string,
    data: {
      performed_date: Date;
      fitness_result: 'fit' | 'conditional' | 'unfit';
      restrictions?: string;
      recommendations?: string;
      next_visit_date?: Date;
      document_path?: string;
      notes?: string;
    }
  ): Promise<OccupationalHealthVisit> {
    return await db
      .updateTable('occupational_health_visits')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

export const healthService = new HealthService();