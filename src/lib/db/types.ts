import { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Enum types matching the database
export type EmploymentStatus = 'active' | 'inactive' | 'terminated' | 'suspended' | 'on_leave';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
export type MedicalVisitType = 'hiring' | 'periodic' | 'change_of_role' | 'return_to_work';
export type MedicalFitness = 'fit' | 'conditional' | 'unfit';
export type UserRole = 'admin' | 'hr' | 'viewer';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'view_sensitive';
export type AuthorizationType = 'crane' | 'forklift' | 'nacelle' | 'load_binder' | 'transport_license' | 'other';
export type StudyType = 'primary' | 'secondary' | 'high_school' | 'vocational' | 'bachelor' | 'master' | 'doctorate' | 'certification' | 'other';
export type DocumentType = 'id_card' | 'diploma' | 'certificate' | 'medical_report' | 'warning_document' | 'authorization' | 'driving_license' | 'contract' | 'other';

// Database table types
export interface DepartmentsTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EmployeesTable {
  id: Generated<string>;
  matriculation_number: string;
  
  // Personal Information
  name: string;
  surname: string;
  cnp: string;
  date_of_birth: Date;
  sex: 'M' | 'F' | null;
  
  // Contact
  email: string | null;
  phone: string | null;
  
  // Address
  address_street: string | null;
  address_number: string | null;
  address_block: string | null;
  address_staircase: string | null;
  address_floor: string | null;
  address_apartment: string | null;
  address_city: string | null;
  address_county: string | null;
  
  // ID Card
  id_series: string | null;
  id_number: string | null;
  id_issued_date: Date | null;
  id_issuer: string | null;
  
  // Family
  marital_status: Generated<MaritalStatus>;
  spouse_name: string | null;
  
  // Employment
  department_id: string | null;
  employment_status: Generated<EmploymentStatus>;
  hire_date: Date | null;
  termination_date: Date | null;
  
  // Photo
  photo_path: string | null;
  
  // Metadata
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
  updated_by: string | null;
}

export interface EmergencyContactsTable {
  id: Generated<string>;
  employee_id: string;
  name: string;
  relationship: string | null;
  phone: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  is_primary: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EmployeeChildrenTable {
  id: Generated<string>;
  employee_id: string;
  name: string;
  cnp: string | null;
  date_of_birth: Date | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface StudiesTable {
  id: Generated<string>;
  employee_id: string;
  study_type: StudyType;
  institution: string;
  specialization: string | null;
  city: string | null;
  country: Generated<string>;
  start_date: Date | null;
  end_date: Date | null;
  has_diploma: Generated<boolean>;
  diploma_series: string | null;
  diploma_number: string | null;
  diploma_date: Date | null;
  document_path: string | null;
  is_qualification_at_hire: Generated<boolean>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ProfessionalCoursesTable {
  id: Generated<string>;
  employee_id: string;
  course_name: string;
  institution: string | null;
  start_date: Date | null;
  end_date: Date | null;
  certificate_number: string | null;
  certificate_date: Date | null;
  document_path: string | null;
  cost: number | null;
  paid_by_company: Generated<boolean>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DrivingLicensesTable {
  id: Generated<string>;
  employee_id: string;
  license_number: string;
  issued_date: Date;
  expiry_date: Date;
  issued_by: string | null;
  document_path: string | null;
  is_suspended: Generated<boolean>;
  suspension_reason: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DrivingLicenseCategoriesTable {
  id: Generated<string>;
  driving_license_id: string;
  category: string;
  obtained_date: Date;
  expiry_date: Date | null;
  restrictions: string | null;
}

export interface AuthorizationsTable {
  id: Generated<string>;
  employee_id: string;
  authorization_type: AuthorizationType;
  authorization_number: string | null;
  custom_type_name: string | null;
  issued_by: string | null;
  issued_date: Date;
  expiry_date: Date;
  document_path: string | null;
  is_suspended: Generated<boolean>;
  suspension_reason: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface InventoryItemsTable {
  id: Generated<string>;
  inventory_code: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  purchase_date: Date | null;
  purchase_value: number | null;
  current_value: number | null;
  amortization_period_months: number | null;
  is_active: Generated<boolean>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EmployeeAssetsTable {
  id: Generated<string>;
  employee_id: string;
  inventory_item_id: string | null;
  custom_name: string | null;
  serial_number: string | null;
  inventory_code: string | null;
  accessories: string | null;
  assigned_date: Date;
  return_date: Date | null;
  expected_return_date: Date | null;
  value_at_assignment: number | null;
  amortization_period_months: number | null;
  amortization_end_date: Date | null;
  condition_on_issue: string | null;
  condition_on_return: string | null;
  photo_path: string | null;
  handover_document_path: string | null;
  return_document_path: string | null;
  notes: string | null;
  is_returned: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
  returned_by: string | null;
}

export interface EmployeeHousingTable {
  id: Generated<string>;
  employee_id: string;
  address: string;
  housing_type: string | null;
  start_date: Date;
  end_date: Date | null;
  monthly_rent: number | null;
  utilities_included: Generated<boolean>;
  deposit_amount: number | null;
  deposit_returned: Generated<boolean>;
  contract_path: string | null;
  notes: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MedicalHistoryTable {
  id: Generated<string>;
  employee_id: string;
  chronic_conditions: string | null;
  allergies: string | null;
  medications: string | null;
  past_surgeries: string | null;
  blood_type: string | null;
  emergency_medical_info: string | null;
  work_restrictions: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  updated_by: string | null;
}

export interface OccupationalHealthVisitsTable {
  id: Generated<string>;
  employee_id: string;
  scheduled_date: Date;
  performed_date: Date | null;
  visit_type: MedicalVisitType;
  medical_provider: string | null;
  doctor_name: string | null;
  fitness_result: MedicalFitness | null;
  restrictions: string | null;
  recommendations: string | null;
  next_visit_date: Date | null;
  document_path: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
}

export interface WarningsTable {
  id: Generated<string>;
  employee_id: string;
  warning_date: Date;
  reason: string;
  severity: string | null;
  issued_by: string | null;
  document_path: string | null;
  employee_response: string | null;
  expiry_date: Date | null;
  is_active: Generated<boolean>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
}

export interface AppreciationsTable {
  id: Generated<string>;
  employee_id: string;
  appreciation_date: Date;
  reason: string;
  issued_by: string | null;
  reward_type: string | null;
  reward_value: number | null;
  document_path: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
}

export interface BehaviorNotesTable {
  id: Generated<string>;
  employee_id: string;
  note_date: Date;
  note_type: string | null;
  description: string;
  reported_by: string | null;
  is_confidential: Generated<boolean>;
  follow_up_required: Generated<boolean>;
  follow_up_date: Date | null;
  follow_up_notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  created_by: string | null;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  name: string;
  role: Generated<UserRole>;
  employee_id: string | null;
  is_active: Generated<boolean>;
  last_login: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AuditLogsTable {
  id: Generated<string>;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  additional_info: any | null;
  created_at: Generated<Date>;
}

export interface DocumentsTable {
  id: Generated<string>;
  entity_type: string;
  entity_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: Generated<Date>;
}

// Database schema
export interface Database {
  departments: DepartmentsTable;
  employees: EmployeesTable;
  emergency_contacts: EmergencyContactsTable;
  employee_children: EmployeeChildrenTable;
  studies: StudiesTable;
  professional_courses: ProfessionalCoursesTable;
  driving_licenses: DrivingLicensesTable;
  driving_license_categories: DrivingLicenseCategoriesTable;
  authorizations: AuthorizationsTable;
  inventory_items: InventoryItemsTable;
  employee_assets: EmployeeAssetsTable;
  employee_housing: EmployeeHousingTable;
  medical_history: MedicalHistoryTable;
  occupational_health_visits: OccupationalHealthVisitsTable;
  warnings: WarningsTable;
  appreciations: AppreciationsTable;
  behavior_notes: BehaviorNotesTable;
  users: UsersTable;
  audit_logs: AuditLogsTable;
  documents: DocumentsTable;
}

// Helper types for selecting, inserting, and updating
export type Department = Selectable<DepartmentsTable>;
export type NewDepartment = Insertable<DepartmentsTable>;
export type DepartmentUpdate = Updateable<DepartmentsTable>;

export type Employee = Selectable<EmployeesTable>;
export type NewEmployee = Insertable<EmployeesTable>;
export type EmployeeUpdate = Updateable<EmployeesTable>;

export type EmergencyContact = Selectable<EmergencyContactsTable>;
export type NewEmergencyContact = Insertable<EmergencyContactsTable>;
export type EmergencyContactUpdate = Updateable<EmergencyContactsTable>;

export type EmployeeChild = Selectable<EmployeeChildrenTable>;
export type NewEmployeeChild = Insertable<EmployeeChildrenTable>;
export type EmployeeChildUpdate = Updateable<EmployeeChildrenTable>;

export type Study = Selectable<StudiesTable>;
export type NewStudy = Insertable<StudiesTable>;
export type StudyUpdate = Updateable<StudiesTable>;

export type ProfessionalCourse = Selectable<ProfessionalCoursesTable>;
export type NewProfessionalCourse = Insertable<ProfessionalCoursesTable>;
export type ProfessionalCourseUpdate = Updateable<ProfessionalCoursesTable>;

export type DrivingLicense = Selectable<DrivingLicensesTable>;
export type NewDrivingLicense = Insertable<DrivingLicensesTable>;
export type DrivingLicenseUpdate = Updateable<DrivingLicensesTable>;

export type DrivingLicenseCategory = Selectable<DrivingLicenseCategoriesTable>;
export type NewDrivingLicenseCategory = Insertable<DrivingLicenseCategoriesTable>;
export type DrivingLicenseCategoryUpdate = Updateable<DrivingLicenseCategoriesTable>;

export type Authorization = Selectable<AuthorizationsTable>;
export type NewAuthorization = Insertable<AuthorizationsTable>;
export type AuthorizationUpdate = Updateable<AuthorizationsTable>;

export type InventoryItem = Selectable<InventoryItemsTable>;
export type NewInventoryItem = Insertable<InventoryItemsTable>;
export type InventoryItemUpdate = Updateable<InventoryItemsTable>;

export type EmployeeAsset = Selectable<EmployeeAssetsTable>;
export type NewEmployeeAsset = Insertable<EmployeeAssetsTable>;
export type EmployeeAssetUpdate = Updateable<EmployeeAssetsTable>;

export type EmployeeHousing = Selectable<EmployeeHousingTable>;
export type NewEmployeeHousing = Insertable<EmployeeHousingTable>;
export type EmployeeHousingUpdate = Updateable<EmployeeHousingTable>;

export type MedicalHistory = Selectable<MedicalHistoryTable>;
export type NewMedicalHistory = Insertable<MedicalHistoryTable>;
export type MedicalHistoryUpdate = Updateable<MedicalHistoryTable>;

export type OccupationalHealthVisit = Selectable<OccupationalHealthVisitsTable>;
export type NewOccupationalHealthVisit = Insertable<OccupationalHealthVisitsTable>;
export type OccupationalHealthVisitUpdate = Updateable<OccupationalHealthVisitsTable>;

export type Warning = Selectable<WarningsTable>;
export type NewWarning = Insertable<WarningsTable>;
export type WarningUpdate = Updateable<WarningsTable>;

export type Appreciation = Selectable<AppreciationsTable>;
export type NewAppreciation = Insertable<AppreciationsTable>;
export type AppreciationUpdate = Updateable<AppreciationsTable>;

export type BehaviorNote = Selectable<BehaviorNotesTable>;
export type NewBehaviorNote = Insertable<BehaviorNotesTable>;
export type BehaviorNoteUpdate = Updateable<BehaviorNotesTable>;

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;

export type Document = Selectable<DocumentsTable>;
export type NewDocument = Insertable<DocumentsTable>;