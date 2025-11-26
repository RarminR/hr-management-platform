# HR Platform - Internal Management System

A comprehensive HR management platform built with Next.js, PostgreSQL, and Kysely for managing employee data, authorizations, medical records, and company assets.

## Features

### Core Modules

- **Employee Management**: Complete employee profiles with personal information, CNP validation, and automatic matriculation number generation
- **Departments**: Hierarchical department structure with employee assignment
- **Studies & Qualifications**: Track educational background and professional courses
- **Authorizations**: Manage driving licenses, work permits, and certifications with expiry tracking
- **Medical & Health**: Occupational health visits, medical history, and fitness tracking
- **Assets & Equipment**: Company equipment assignment with amortization tracking
- **Housing**: Employee accommodation management
- **Performance Management**: Warnings, appreciations, and behavior notes with automatic expiry
- **Reports**: Comprehensive reporting on expirations, warnings, and employee metrics
- **Audit Logging**: Complete audit trail for sensitive operations

### Security Features

- **Role-Based Access Control (RBAC)**: Admin, HR, and Viewer roles
- **NextAuth Integration**: Secure authentication with credentials provider
- **Protected Routes**: Middleware-based route protection
- **Audit Logging**: Track all sensitive data access and modifications
- **Input Validation**: Zod-based validation on all endpoints

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Kysely ORM
- **Authentication**: NextAuth.js with credentials provider
- **Validation**: Zod
- **Forms**: React Hook Form

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd romservice-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hr_platform

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# File Upload (Optional - S3-compatible)
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Application
NODE_ENV=development
APP_URL=http://localhost:3000
```

4. **Set up the database**

Create a new PostgreSQL database:
```bash
createdb hr_platform
```

Run the migrations:
```bash
npm run db:migrate
```

5. **Seed the database with initial data**

This will create an admin user and sample departments:
```bash
npm run db:seed
```

Default admin credentials:
- Email: `admin@company.com`
- Password: `admin123`

⚠️ **Important**: Change the admin password after first login!

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
romservice-app/
├── migrations/              # Database migration files
│   └── 001_initial_schema.sql
├── src/
│   ├── app/                # Next.js app router
│   │   ├── api/           # API routes
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   └── ...
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   ├── tables/       # Table components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/              # Utility libraries
│   │   ├── auth/        # NextAuth configuration
│   │   ├── db/          # Database client and types
│   │   └── utils/       # Utility functions
│   ├── server/           # Server-side code
│   │   └── services/    # Business logic services
│   └── types/           # TypeScript type definitions
├── .env.local           # Environment variables (create this)
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- `employees` - Core employee data
- `departments` - Organizational structure
- `emergency_contacts` - Emergency contact information
- `employee_children` - Employee family information
- `studies` - Educational qualifications
- `professional_courses` - Training and certifications
- `driving_licenses` & `driving_license_categories` - Driving qualifications
- `authorizations` - Work permits and certifications
- `inventory_items` & `employee_assets` - Equipment tracking
- `employee_housing` - Accommodation records
- `medical_history` & `occupational_health_visits` - Health records
- `warnings`, `appreciations`, `behavior_notes` - Performance tracking
- `users` - System users for authentication
- `audit_logs` - Audit trail
- `documents` - File attachments

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Employees
- `GET /api/employees` - List employees with pagination
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Departments
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Additional endpoints for all other modules follow similar patterns.

## Business Logic

### CNP (Romanian Personal Numeric Code) Validation
The system automatically validates and extracts information from CNP:
- Date of birth
- Gender
- County of birth
- Checksum validation

### Matriculation Number Generation
Format: `YEAR-DEPT-####`
Example: `2024-IT-0001`

### Warning System
- Warnings automatically expire after 12 months
- 3 active warnings = Yellow Card
- 2 Yellow Cards = Termination flag

### Appreciation System
- 3 appreciations trigger salary increase recommendation (+3%)

### Asset Amortization
- Automatic calculation of amortization end dates
- Tracking of asset conditions and values
- Photo requirement for assets > €200

## Security Considerations

1. **Authentication**: All routes except public pages require authentication
2. **Authorization**: Role-based access control for sensitive operations
3. **Data Protection**: 
   - Medical records require HR or Admin role
   - Financial data requires special permissions
   - Audit logging for all sensitive operations
4. **Input Validation**: All user inputs are validated using Zod schemas
5. **SQL Injection Prevention**: Using Kysely query builder for safe queries

## Deployment

### Production Environment Variables

```env
DATABASE_URL=postgresql://user:pass@production-host:5432/hr_platform
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NODE_ENV=production
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Maintenance

### Database Backups
```bash
pg_dump hr_platform > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
psql hr_platform < backup_file.sql
```

### Update Dependencies
```bash
npm update
npm audit fix
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env.local
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check user exists and is active in database
   - Clear browser cookies

3. **Migration Errors**
   - Ensure database is empty before first migration
   - Check PostgreSQL version compatibility (14+)

## 🔧 Development Workflow

### Branch Strategy

We follow Git Flow methodology:

- `main` - Production-ready code (protected branch)
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches  
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation branches

### Creating Features

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/feature-name

# Work on your feature
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/feature-name

# Create Pull Request to develop
```

### Fixing Bugs

```bash
# For bugs in develop
git checkout develop
git pull origin develop
git checkout -b bugfix/bug-description

# For production hotfixes
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Add/update tests
- `build:` Build system changes
- `ci:` CI configuration changes
- `chore:` Other changes (maintenance)
- `revert:` Revert previous commit

Examples:
```bash
git commit -m "feat: add employee export functionality"
git commit -m "fix: resolve CNP validation issue"
git commit -m "docs: update API documentation"
```

### Pull Request Process

1. Update your branch with latest develop
2. Resolve any conflicts
3. Ensure all tests pass
4. Request review from team members
5. Merge after approval

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request to `develop` branch

## License

Private - Internal Use Only

## Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: November 2024