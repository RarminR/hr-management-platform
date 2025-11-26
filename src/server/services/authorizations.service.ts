import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { 
  Authorization, 
  NewAuthorization, 
  AuthorizationUpdate,
  DrivingLicense,
  NewDrivingLicense,
  DrivingLicenseUpdate,
  DrivingLicenseCategory,
  NewDrivingLicenseCategory
} from '@/lib/db/types';

export class AuthorizationsService {
  /**
   * Create authorization for employee
   */
  async createAuthorization(data: NewAuthorization): Promise<Authorization> {
    return await db
      .insertInto('authorizations')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get authorization by ID
   */
  async getAuthorizationById(id: string): Promise<Authorization | undefined> {
    return await db
      .selectFrom('authorizations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update authorization
   */
  async updateAuthorization(id: string, data: AuthorizationUpdate): Promise<Authorization> {
    return await db
      .updateTable('authorizations')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete authorization
   */
  async deleteAuthorization(id: string): Promise<void> {
    await db
      .deleteFrom('authorizations')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all authorizations for an employee
   */
  async getEmployeeAuthorizations(employeeId: string): Promise<Authorization[]> {
    return await db
      .selectFrom('authorizations')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('expiry_date', 'asc')
      .execute();
  }

  /**
   * Get expiring authorizations
   */
  async getExpiringAuthorizations(daysThreshold = 30): Promise<Array<Authorization & { employee_name: string }>> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const result = await db
      .selectFrom('authorizations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select([
        'a.id',
        'a.employee_id',
        'a.authorization_type',
        'a.authorization_number',
        'a.custom_type_name',
        'a.issued_by',
        'a.issued_date',
        'a.expiry_date',
        'a.document_path',
        'a.is_suspended',
        'a.suspension_reason',
        'a.notes',
        'a.created_at',
        'a.updated_at',
      ])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('a.expiry_date', '<=', thresholdDate)
      .where('a.expiry_date', '>=', new Date())
      .where('a.is_suspended', '=', false)
      .where('e.employment_status', '=', 'active')
      .orderBy('a.expiry_date', 'asc')
      .execute();

    return result as any;
  }

  /**
   * Get expired authorizations
   */
  async getExpiredAuthorizations(): Promise<Array<Authorization & { employee_name: string }>> {
    const result = await db
      .selectFrom('authorizations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select([
        'a.id',
        'a.employee_id',
        'a.authorization_type',
        'a.authorization_number',
        'a.custom_type_name',
        'a.issued_by',
        'a.issued_date',
        'a.expiry_date',
        'a.document_path',
        'a.is_suspended',
        'a.suspension_reason',
        'a.notes',
        'a.created_at',
        'a.updated_at',
      ])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('a.expiry_date', '<', new Date())
      .where('e.employment_status', '=', 'active')
      .orderBy('a.expiry_date', 'desc')
      .execute();

    return result as any;
  }

  /**
   * Suspend authorization
   */
  async suspendAuthorization(id: string, reason: string): Promise<Authorization> {
    return await db
      .updateTable('authorizations')
      .set({
        is_suspended: true,
        suspension_reason: reason,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Reactivate authorization
   */
  async reactivateAuthorization(id: string): Promise<Authorization> {
    return await db
      .updateTable('authorizations')
      .set({
        is_suspended: false,
        suspension_reason: null,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // Driving License Methods

  /**
   * Create driving license
   */
  async createDrivingLicense(data: NewDrivingLicense, categories: string[]): Promise<DrivingLicense> {
    return await db.transaction().execute(async (trx) => {
      // Create the license
      const license = await trx
        .insertInto('driving_licenses')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Add categories
      if (categories.length > 0) {
        const categoryRecords = categories.map(cat => ({
          driving_license_id: license.id,
          category: cat,
          obtained_date: license.issued_date,
          expiry_date: license.expiry_date,
        }));

        await trx
          .insertInto('driving_license_categories')
          .values(categoryRecords)
          .execute();
      }

      return license;
    });
  }

  /**
   * Get driving license by ID
   */
  async getDrivingLicenseById(id: string): Promise<DrivingLicense | undefined> {
    return await db
      .selectFrom('driving_licenses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Get driving license with categories
   */
  async getDrivingLicenseWithCategories(id: string): Promise<{
    license: DrivingLicense;
    categories: DrivingLicenseCategory[];
  } | undefined> {
    const license = await this.getDrivingLicenseById(id);
    
    if (!license) {
      return undefined;
    }

    const categories = await db
      .selectFrom('driving_license_categories')
      .selectAll()
      .where('driving_license_id', '=', id)
      .execute();

    return { license, categories };
  }

  /**
   * Update driving license
   */
  async updateDrivingLicense(id: string, data: DrivingLicenseUpdate): Promise<DrivingLicense> {
    return await db
      .updateTable('driving_licenses')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Add category to driving license
   */
  async addDrivingLicenseCategory(data: NewDrivingLicenseCategory): Promise<DrivingLicenseCategory> {
    // Check if category already exists
    const existing = await db
      .selectFrom('driving_license_categories')
      .select('id')
      .where('driving_license_id', '=', data.driving_license_id)
      .where('category', '=', data.category)
      .executeTakeFirst();

    if (existing) {
      throw new Error('Category already exists for this license');
    }

    return await db
      .insertInto('driving_license_categories')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Remove category from driving license
   */
  async removeDrivingLicenseCategory(id: string): Promise<void> {
    await db
      .deleteFrom('driving_license_categories')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get employee's driving licenses
   */
  async getEmployeeDrivingLicenses(employeeId: string): Promise<DrivingLicense[]> {
    return await db
      .selectFrom('driving_licenses')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('expiry_date', 'desc')
      .execute();
  }

  /**
   * Get expiring driving licenses
   */
  async getExpiringDrivingLicenses(daysThreshold = 30): Promise<Array<DrivingLicense & { employee_name: string }>> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const result = await db
      .selectFrom('driving_licenses as dl')
      .innerJoin('employees as e', 'e.id', 'dl.employee_id')
      .select([
        'dl.id',
        'dl.employee_id',
        'dl.license_number',
        'dl.issued_date',
        'dl.expiry_date',
        'dl.issued_by',
        'dl.document_path',
        'dl.is_suspended',
        'dl.suspension_reason',
        'dl.created_at',
        'dl.updated_at',
      ])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('dl.expiry_date', '<=', thresholdDate)
      .where('dl.expiry_date', '>=', new Date())
      .where('dl.is_suspended', '=', false)
      .where('e.employment_status', '=', 'active')
      .orderBy('dl.expiry_date', 'asc')
      .execute();

    return result as any;
  }

  /**
   * Search employees by authorization type
   */
  async searchByAuthorizationType(
    authorizationType: string,
    onlyActive = true
  ): Promise<Array<{ employee_id: string; employee_name: string; authorization: Authorization }>> {
    let query = db
      .selectFrom('authorizations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select([
        'a.id',
        'a.employee_id',
        'a.authorization_type',
        'a.authorization_number',
        'a.custom_type_name',
        'a.issued_by',
        'a.issued_date',
        'a.expiry_date',
        'a.document_path',
        'a.is_suspended',
        'a.suspension_reason',
        'a.notes',
        'a.created_at',
        'a.updated_at',
      ])
      .select(sql<string>`CONCAT(e.name, ' ', e.surname)`.as('employee_name'))
      .where('e.employment_status', '=', 'active');

    if (authorizationType === 'other') {
      query = query.where('a.authorization_type', '=', 'other');
    } else {
      query = query.where('a.authorization_type', '=', authorizationType as any);
    }

    if (onlyActive) {
      query = query
        .where('a.is_suspended', '=', false)
        .where('a.expiry_date', '>', new Date());
    }

    const results = await query.orderBy('e.surname', 'asc').execute();

    return results.map((r: any) => ({
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      authorization: {
        id: r.id,
        employee_id: r.employee_id,
        authorization_type: r.authorization_type,
        authorization_number: r.authorization_number,
        custom_type_name: r.custom_type_name,
        issued_by: r.issued_by,
        issued_date: r.issued_date,
        expiry_date: r.expiry_date,
        document_path: r.document_path,
        is_suspended: r.is_suspended,
        suspension_reason: r.suspension_reason,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    }));
  }
}

export const authorizationsService = new AuthorizationsService();