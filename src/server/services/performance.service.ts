import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { 
  Warning, 
  NewWarning, 
  WarningUpdate,
  Appreciation,
  NewAppreciation,
  AppreciationUpdate,
  BehaviorNote,
  NewBehaviorNote,
  BehaviorNoteUpdate
} from '@/lib/db/types';
import { addMonths } from 'date-fns';

export class PerformanceService {
  // Warning Methods

  /**
   * Issue warning to employee
   */
  async issueWarning(data: Omit<NewWarning, 'expiry_date'>): Promise<Warning> {
    // Calculate expiry date (12 months from warning date)
    const warningDate = data.warning_date || new Date();
    const expiryDate = addMonths(warningDate, 12);

    return await db
      .insertInto('warnings')
      .values({
        ...data,
        expiry_date: expiryDate,
        is_active: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get warning by ID
   */
  async getWarningById(id: string): Promise<Warning | undefined> {
    return await db
      .selectFrom('warnings')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update warning
   */
  async updateWarning(id: string, data: WarningUpdate): Promise<Warning> {
    return await db
      .updateTable('warnings')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Deactivate warning
   */
  async deactivateWarning(id: string): Promise<Warning> {
    return await db
      .updateTable('warnings')
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get active warnings for employee
   */
  async getActiveWarnings(employeeId: string): Promise<Warning[]> {
    return await db
      .selectFrom('warnings')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('is_active', '=', true)
      .where('expiry_date', '>', new Date())
      .orderBy('warning_date', 'desc')
      .execute();
  }

  /**
   * Get all warnings for employee
   */
  async getEmployeeWarnings(employeeId: string): Promise<Warning[]> {
    return await db
      .selectFrom('warnings')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('warning_date', 'desc')
      .execute();
  }

  /**
   * Check if employee should receive yellow card
   */
  async checkYellowCardStatus(employeeId: string): Promise<{
    shouldReceiveYellowCard: boolean;
    activeWarningsCount: number;
    yellowCardCount: number;
  }> {
    const activeWarnings = await this.getActiveWarnings(employeeId);
    const activeWarningsCount = activeWarnings.length;
    
    // Check how many yellow cards (sets of 3 warnings) the employee has
    const yellowCardCount = Math.floor(activeWarningsCount / 3);
    const shouldReceiveYellowCard = activeWarningsCount >= 3;

    return {
      shouldReceiveYellowCard,
      activeWarningsCount,
      yellowCardCount,
    };
  }

  /**
   * Get employees with multiple warnings
   */
  async getEmployeesWithMultipleWarnings(minWarnings = 2): Promise<Array<{
    employee_id: string;
    employee_name: string;
    warning_count: number;
  }>> {
    const result = await db
      .selectFrom('warnings as w')
      .innerJoin('employees as e', 'e.id', 'w.employee_id')
      .select(['w.employee_id'])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .select(sql<number>`COUNT(w.id)`.as('warning_count'))
      .where('w.is_active', '=', true)
      .where('w.expiry_date', '>', new Date())
      .where('e.employment_status', '=', 'active')
      .groupBy(['w.employee_id', 'e.name', 'e.surname'])
      .having(sql`COUNT(w.id)`, '>=', minWarnings)
      .orderBy('warning_count', 'desc')
      .execute();

    return result as any;
  }

  /**
   * Expire old warnings
   */
  async expireOldWarnings(): Promise<number> {
    const result = await db
      .updateTable('warnings')
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where('is_active', '=', true)
      .where('expiry_date', '<=', new Date())
      .execute();

    return Number(result[0]?.numUpdatedRows || 0);
  }

  // Appreciation Methods

  /**
   * Add appreciation for employee
   */
  async addAppreciation(data: NewAppreciation): Promise<Appreciation> {
    return await db
      .insertInto('appreciations')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get appreciation by ID
   */
  async getAppreciationById(id: string): Promise<Appreciation | undefined> {
    return await db
      .selectFrom('appreciations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update appreciation
   */
  async updateAppreciation(id: string, data: AppreciationUpdate): Promise<Appreciation> {
    return await db
      .updateTable('appreciations')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete appreciation
   */
  async deleteAppreciation(id: string): Promise<void> {
    await db
      .deleteFrom('appreciations')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all appreciations for employee
   */
  async getEmployeeAppreciations(employeeId: string): Promise<Appreciation[]> {
    return await db
      .selectFrom('appreciations')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('appreciation_date', 'desc')
      .execute();
  }

  /**
   * Check if employee qualifies for salary increase
   */
  async checkSalaryIncreaseRecommendation(employeeId: string): Promise<{
    recommendIncrease: boolean;
    appreciationCount: number;
    lastYearAppreciations: Appreciation[];
  }> {
    // Get appreciations from last 12 months
    const oneYearAgo = addMonths(new Date(), -12);
    
    const lastYearAppreciations = await db
      .selectFrom('appreciations')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('appreciation_date', '>=', oneYearAgo)
      .orderBy('appreciation_date', 'desc')
      .execute();

    const appreciationCount = lastYearAppreciations.length;
    const recommendIncrease = appreciationCount >= 3;

    return {
      recommendIncrease,
      appreciationCount,
      lastYearAppreciations,
    };
  }

  /**
   * Get top performers
   */
  async getTopPerformers(limit = 10): Promise<Array<{
    employee_id: string;
    employee_name: string;
    appreciation_count: number;
  }>> {
    const result = await db
      .selectFrom('appreciations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select(['a.employee_id'])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .select(sql<number>`COUNT(a.id)`.as('appreciation_count'))
      .where('e.employment_status', '=', 'active')
      .where('a.appreciation_date', '>=', addMonths(new Date(), -12))
      .groupBy(['a.employee_id', 'e.name', 'e.surname'])
      .orderBy('appreciation_count', 'desc')
      .limit(limit)
      .execute();

    return result as any;
  }

  // Behavior Note Methods

  /**
   * Add behavior note
   */
  async addBehaviorNote(data: NewBehaviorNote): Promise<BehaviorNote> {
    return await db
      .insertInto('behavior_notes')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get behavior note by ID
   */
  async getBehaviorNoteById(id: string): Promise<BehaviorNote | undefined> {
    return await db
      .selectFrom('behavior_notes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update behavior note
   */
  async updateBehaviorNote(id: string, data: BehaviorNoteUpdate): Promise<BehaviorNote> {
    return await db
      .updateTable('behavior_notes')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete behavior note
   */
  async deleteBehaviorNote(id: string): Promise<void> {
    await db
      .deleteFrom('behavior_notes')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get employee behavior notes
   */
  async getEmployeeBehaviorNotes(
    employeeId: string,
    includeConfidential = false
  ): Promise<BehaviorNote[]> {
    let query = db
      .selectFrom('behavior_notes')
      .selectAll()
      .where('employee_id', '=', employeeId);

    if (!includeConfidential) {
      query = query.where('is_confidential', '=', false);
    }

    return await query
      .orderBy('note_date', 'desc')
      .execute();
  }

  /**
   * Get notes requiring follow-up
   */
  async getNotesRequiringFollowUp(): Promise<BehaviorNote[]> {
    return await db
      .selectFrom('behavior_notes')
      .selectAll()
      .where('follow_up_required', '=', true)
      .where('follow_up_date', '<=', addMonths(new Date(), 1))
      .orderBy('follow_up_date', 'asc')
      .execute();
  }

  /**
   * Get employee performance summary
   */
  async getEmployeePerformanceSummary(employeeId: string): Promise<{
    warnings: {
      total: number;
      active: number;
      yellowCards: number;
    };
    appreciations: {
      total: number;
      lastYear: number;
      recommendsSalaryIncrease: boolean;
    };
    behaviorNotes: {
      total: number;
      positive: number;
      negative: number;
      needsFollowUp: number;
    };
  }> {
    const [warnings, appreciations, behaviorNotes] = await Promise.all([
      this.getEmployeeWarnings(employeeId),
      this.getEmployeeAppreciations(employeeId),
      this.getEmployeeBehaviorNotes(employeeId, true),
    ]);

    const activeWarnings = warnings.filter(
      w => w.is_active && w.expiry_date && w.expiry_date > new Date()
    );

    const oneYearAgo = addMonths(new Date(), -12);
    const lastYearAppreciations = appreciations.filter(
      a => a.appreciation_date >= oneYearAgo
    );

    const positiveNotes = behaviorNotes.filter(n => n.note_type === 'positive');
    const negativeNotes = behaviorNotes.filter(n => n.note_type === 'negative');
    const needsFollowUp = behaviorNotes.filter(n => n.follow_up_required && !n.follow_up_notes);

    return {
      warnings: {
        total: warnings.length,
        active: activeWarnings.length,
        yellowCards: Math.floor(activeWarnings.length / 3),
      },
      appreciations: {
        total: appreciations.length,
        lastYear: lastYearAppreciations.length,
        recommendsSalaryIncrease: lastYearAppreciations.length >= 3,
      },
      behaviorNotes: {
        total: behaviorNotes.length,
        positive: positiveNotes.length,
        negative: negativeNotes.length,
        needsFollowUp: needsFollowUp.length,
      },
    };
  }
}

export const performanceService = new PerformanceService();