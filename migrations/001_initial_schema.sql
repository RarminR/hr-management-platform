-- HR Platform Database Schema
-- PostgreSQL Database Schema for Internal HR Management System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE employment_status AS ENUM (
    'active',
    'inactive',
    'terminated',
    'suspended',
    'on_leave'
);

CREATE TYPE marital_status AS ENUM (
    'single',
    'married',
    'divorced',
    'widowed',
    'separated'
);

CREATE TYPE medical_visit_type AS ENUM (
    'hiring',
    'periodic',
    'change_of_role',
    'return_to_work'
);

CREATE TYPE medical_fitness AS ENUM (
    'fit',
    'conditional',
    'unfit'
);

CREATE TYPE user_role AS ENUM (
    'admin',
    'hr',
    'viewer'
);

CREATE TYPE audit_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'view_sensitive'
);

CREATE TYPE authorization_type AS ENUM (
    'crane',
    'forklift',
    'nacelle',
    'load_binder',
    'transport_license',
    'other'
);

CREATE TYPE study_type AS ENUM (
    'primary',
    'secondary',
    'high_school',
    'vocational',
    'bachelor',
    'master',
    'doctorate',
    'certification',
    'other'
);

CREATE TYPE document_type AS ENUM (
    'id_card',
    'diploma',
    'certificate',
    'medical_report',
    'warning_document',
    'authorization',
    'driving_license',
    'contract',
    'other'
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table (Core profile)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriculation_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Personal Information
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    cnp VARCHAR(13) UNIQUE NOT NULL, -- Romanian Personal Numeric Code
    date_of_birth DATE NOT NULL,
    sex CHAR(1) CHECK (sex IN ('M', 'F')),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Address
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_block VARCHAR(20),
    address_staircase VARCHAR(10),
    address_floor VARCHAR(10),
    address_apartment VARCHAR(10),
    address_city VARCHAR(100),
    address_county VARCHAR(100),
    
    -- ID Card Information
    id_series VARCHAR(10),
    id_number VARCHAR(20),
    id_issued_date DATE,
    id_issuer VARCHAR(255),
    
    -- Family Information
    marital_status marital_status DEFAULT 'single',
    spouse_name VARCHAR(200),
    
    -- Employment Information
    department_id UUID REFERENCES departments(id),
    employment_status employment_status DEFAULT 'active',
    hire_date DATE,
    termination_date DATE,
    
    -- Photo
    photo_path VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children
CREATE TABLE employee_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    cnp VARCHAR(13),
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studies
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    study_type study_type NOT NULL,
    institution VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Romania',
    start_date DATE,
    end_date DATE,
    has_diploma BOOLEAN DEFAULT FALSE,
    diploma_series VARCHAR(50),
    diploma_number VARCHAR(50),
    diploma_date DATE,
    document_path VARCHAR(500),
    is_qualification_at_hire BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional courses during employment
CREATE TABLE professional_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    start_date DATE,
    end_date DATE,
    certificate_number VARCHAR(100),
    certificate_date DATE,
    document_path VARCHAR(500),
    cost DECIMAL(10, 2),
    paid_by_company BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driving licenses
CREATE TABLE driving_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issued_by VARCHAR(255),
    document_path VARCHAR(500),
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driving license categories
CREATE TABLE driving_license_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driving_license_id UUID NOT NULL REFERENCES driving_licenses(id) ON DELETE CASCADE,
    category VARCHAR(10) NOT NULL, -- B, C, CE, D, etc.
    obtained_date DATE NOT NULL,
    expiry_date DATE,
    restrictions TEXT,
    UNIQUE(driving_license_id, category)
);

-- Authorizations (crane, forklift, etc.)
CREATE TABLE authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    authorization_type authorization_type NOT NULL,
    authorization_number VARCHAR(100),
    custom_type_name VARCHAR(255), -- For 'other' type
    issued_by VARCHAR(255),
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    document_path VARCHAR(500),
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items (master list)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    purchase_date DATE,
    purchase_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    amortization_period_months INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee equipment/assets
CREATE TABLE employee_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    
    -- Asset details
    custom_name VARCHAR(255), -- If not from inventory
    serial_number VARCHAR(100),
    inventory_code VARCHAR(50),
    accessories TEXT,
    
    -- Assignment details
    assigned_date DATE NOT NULL,
    return_date DATE,
    expected_return_date DATE,
    
    -- Financial
    value_at_assignment DECIMAL(10, 2),
    amortization_period_months INTEGER,
    amortization_end_date DATE,
    
    -- Condition tracking
    condition_on_issue VARCHAR(500),
    condition_on_return VARCHAR(500),
    
    -- Documentation
    photo_path VARCHAR(500), -- Required if value > 200
    handover_document_path VARCHAR(500),
    return_document_path VARCHAR(500),
    
    notes TEXT,
    is_returned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    returned_by UUID
);

-- Housing
CREATE TABLE employee_housing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    housing_type VARCHAR(50), -- apartment, room, house
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(10, 2),
    utilities_included BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10, 2),
    deposit_returned BOOLEAN DEFAULT FALSE,
    contract_path VARCHAR(500),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical history
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    chronic_conditions TEXT,
    allergies TEXT,
    medications TEXT,
    past_surgeries TEXT,
    blood_type VARCHAR(10),
    emergency_medical_info TEXT,
    work_restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Occupational health visits
CREATE TABLE occupational_health_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    performed_date DATE,
    visit_type medical_visit_type NOT NULL,
    medical_provider VARCHAR(255),
    doctor_name VARCHAR(200),
    fitness_result medical_fitness,
    restrictions TEXT,
    recommendations TEXT,
    next_visit_date DATE,
    document_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Warnings
CREATE TABLE warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    warning_date DATE NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(50), -- verbal, written, final
    issued_by VARCHAR(200),
    document_path VARCHAR(500),
    employee_response TEXT,
    expiry_date DATE, -- Auto-calculated: warning_date + 12 months
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Appreciations
CREATE TABLE appreciations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    appreciation_date DATE NOT NULL,
    reason TEXT NOT NULL,
    issued_by VARCHAR(200),
    reward_type VARCHAR(100), -- bonus, promotion, certificate, etc.
    reward_value DECIMAL(10, 2),
    document_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Behavior notes
CREATE TABLE behavior_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    note_type VARCHAR(50), -- positive, negative, neutral, observation
    description TEXT NOT NULL,
    reported_by VARCHAR(200),
    is_confidential BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    employee_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    additional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (general document storage)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL, -- employee, warning, appreciation, etc.
    entity_id UUID NOT NULL,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_employees_cnp ON employees(cnp);
CREATE INDEX idx_employees_matriculation ON employees(matriculation_number);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_name ON employees(name, surname);

CREATE INDEX idx_emergency_contacts_employee ON emergency_contacts(employee_id);
CREATE INDEX idx_children_employee ON employee_children(employee_id);
CREATE INDEX idx_studies_employee ON studies(employee_id);
CREATE INDEX idx_courses_employee ON professional_courses(employee_id);
CREATE INDEX idx_driving_licenses_employee ON driving_licenses(employee_id);
CREATE INDEX idx_authorizations_employee ON authorizations(employee_id);
CREATE INDEX idx_authorizations_expiry ON authorizations(expiry_date);
CREATE INDEX idx_assets_employee ON employee_assets(employee_id);
CREATE INDEX idx_assets_returned ON employee_assets(is_returned);
CREATE INDEX idx_housing_employee ON employee_housing(employee_id);
CREATE INDEX idx_housing_active ON employee_housing(is_active);
CREATE INDEX idx_medical_employee ON medical_history(employee_id);
CREATE INDEX idx_health_visits_employee ON occupational_health_visits(employee_id);
CREATE INDEX idx_health_visits_next ON occupational_health_visits(next_visit_date);
CREATE INDEX idx_warnings_employee ON warnings(employee_id);
CREATE INDEX idx_warnings_active ON warnings(is_active, expiry_date);
CREATE INDEX idx_appreciations_employee ON appreciations(employee_id);
CREATE INDEX idx_behavior_notes_employee ON behavior_notes(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON employee_children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON professional_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driving_licenses_updated_at BEFORE UPDATE ON driving_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorizations_updated_at BEFORE UPDATE ON authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON employee_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_housing_updated_at BEFORE UPDATE ON employee_housing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_visits_updated_at BEFORE UPDATE ON occupational_health_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warnings_updated_at BEFORE UPDATE ON warnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appreciations_updated_at BEFORE UPDATE ON appreciations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavior_notes_updated_at BEFORE UPDATE ON behavior_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();