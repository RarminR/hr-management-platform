import { db } from '@/lib/db/client';
import { 
  Study, 
  NewStudy, 
  StudyUpdate,
  ProfessionalCourse,
  NewProfessionalCourse,
  ProfessionalCourseUpdate
} from '@/lib/db/types';

export class StudiesService {
  /**
   * Add study/qualification for employee
   */
  async addStudy(data: NewStudy): Promise<Study> {
    return await db
      .insertInto('studies')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get study by ID
   */
  async getStudyById(id: string): Promise<Study | undefined> {
    return await db
      .selectFrom('studies')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update study
   */
  async updateStudy(id: string, data: StudyUpdate): Promise<Study> {
    return await db
      .updateTable('studies')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete study
   */
  async deleteStudy(id: string): Promise<void> {
    await db
      .deleteFrom('studies')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all studies for an employee
   */
  async getEmployeeStudies(employeeId: string): Promise<Study[]> {
    return await db
      .selectFrom('studies')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('end_date', 'desc')
      .execute();
  }

  /**
   * Get qualifications at hire
   */
  async getQualificationsAtHire(employeeId: string): Promise<Study[]> {
    return await db
      .selectFrom('studies')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('is_qualification_at_hire', '=', true)
      .orderBy('end_date', 'desc')
      .execute();
  }

  // Professional Courses Methods

  /**
   * Add professional course
   */
  async addProfessionalCourse(data: NewProfessionalCourse): Promise<ProfessionalCourse> {
    return await db
      .insertInto('professional_courses')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get professional course by ID
   */
  async getProfessionalCourseById(id: string): Promise<ProfessionalCourse | undefined> {
    return await db
      .selectFrom('professional_courses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Update professional course
   */
  async updateProfessionalCourse(id: string, data: ProfessionalCourseUpdate): Promise<ProfessionalCourse> {
    return await db
      .updateTable('professional_courses')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete professional course
   */
  async deleteProfessionalCourse(id: string): Promise<void> {
    await db
      .deleteFrom('professional_courses')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all professional courses for an employee
   */
  async getEmployeeProfessionalCourses(employeeId: string): Promise<ProfessionalCourse[]> {
    return await db
      .selectFrom('professional_courses')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('end_date', 'desc')
      .execute();
  }

  /**
   * Get company-funded courses
   */
  async getCompanyFundedCourses(employeeId?: string): Promise<ProfessionalCourse[]> {
    let query = db
      .selectFrom('professional_courses')
      .selectAll()
      .where('paid_by_company', '=', true);

    if (employeeId) {
      query = query.where('employee_id', '=', employeeId);
    }

    return await query
      .orderBy('end_date', 'desc')
      .execute();
  }

  /**
   * Calculate total training investment for an employee
   */
  async calculateTrainingInvestment(employeeId: string): Promise<number> {
    const courses = await db
      .selectFrom('professional_courses')
      .select('cost')
      .where('employee_id', '=', employeeId)
      .where('paid_by_company', '=', true)
      .execute();

    return courses.reduce((total, course) => total + (course.cost || 0), 0);
  }

  /**
   * Get employees by study type or specialization
   */
  async searchByQualification(params: {
    studyType?: string;
    specialization?: string;
    hasDiploma?: boolean;
  }): Promise<Array<{ employee_id: string; employee_name: string; study: Study }>> {
    let query = db
      .selectFrom('studies as s')
      .innerJoin('employees as e', 'e.id', 's.employee_id')
      .selectAll('s')
      .select(['e.name', 'e.surname'])
      .where('e.employment_status', '=', 'active');

    if (params.studyType) {
      query = query.where('s.study_type', '=', params.studyType as any);
    }

    if (params.specialization) {
      query = query.where('s.specialization', 'ilike', `%${params.specialization}%`);
    }

    if (params.hasDiploma !== undefined) {
      query = query.where('s.has_diploma', '=', params.hasDiploma);
    }

    const results = await query.execute();

    return results.map((r: any) => ({
      employee_id: r.employee_id,
      employee_name: `${r.name} ${r.surname}`,
      study: {
        id: r.id,
        employee_id: r.employee_id,
        study_type: r.study_type,
        institution: r.institution,
        specialization: r.specialization,
        city: r.city,
        country: r.country,
        start_date: r.start_date,
        end_date: r.end_date,
        has_diploma: r.has_diploma,
        diploma_series: r.diploma_series,
        diploma_number: r.diploma_number,
        diploma_date: r.diploma_date,
        document_path: r.document_path,
        is_qualification_at_hire: r.is_qualification_at_hire,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    }));
  }
}

export const studiesService = new StudiesService();