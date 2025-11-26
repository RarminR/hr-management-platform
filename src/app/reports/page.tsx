import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  Calendar,
  Shield,
  Heart,
  Award,
  Download,
  Filter
} from 'lucide-react';
import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { formatDate, isExpiringSoon, isExpired } from '@/lib/utils/date';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get expiring driving licenses
  const expiringLicenses = await db
    .selectFrom('driving_licenses as dl')
    .innerJoin('employees as e', 'e.id', 'dl.employee_id')
    .select([
      'dl.id',
      'e.id as employee_id',
      'dl.license_number',
      'dl.expiry_date',
      'e.name',
      'e.surname',
      'e.matriculation_number',
    ])
    .where('dl.expiry_date', '<=', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .where('dl.expiry_date', '>=', new Date())
    .where('e.employment_status', '=', 'active')
    .orderBy('dl.expiry_date', 'asc')
    .limit(10)
    .execute();

  // Get expiring authorizations
  const expiringAuthorizations = await db
    .selectFrom('authorizations as a')
    .innerJoin('employees as e', 'e.id', 'a.employee_id')
    .select([
      'a.id',
      'e.id as employee_id',
      'a.authorization_type',
      'a.custom_type_name',
      'a.expiry_date',
      'e.name',
      'e.surname',
      'e.matriculation_number',
    ])
    .where('a.expiry_date', '<=', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .where('a.expiry_date', '>=', new Date())
    .where('e.employment_status', '=', 'active')
    .orderBy('a.expiry_date', 'asc')
    .limit(10)
    .execute();

  // Get pending medical visits
  const pendingMedical = await db
    .selectFrom('occupational_health_visits as v')
    .innerJoin('employees as e', 'e.id', 'v.employee_id')
    .select([
      'v.id',
      'e.id as employee_id',
      'v.scheduled_date',
      'v.visit_type',
      'e.name',
      'e.surname',
      'e.matriculation_number',
    ])
    .where('v.performed_date', 'is', null)
    .where('v.scheduled_date', '<=', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .where('e.employment_status', '=', 'active')
    .orderBy('v.scheduled_date', 'asc')
    .limit(10)
    .execute();

  // Get employees with multiple warnings
  const multipleWarnings = await db
    .selectFrom('warnings as w')
    .innerJoin('employees as e', 'e.id', 'w.employee_id')
    .select([
      'e.id',
      'e.name',
      'e.surname',
      'e.matriculation_number',
    ])
    .select(sql<number>`COUNT(w.id)`.as('warning_count'))
    .where('w.is_active', '=', true)
    .where('w.expiry_date', '>', new Date())
    .where('e.employment_status', '=', 'active')
    .groupBy(['e.id', 'e.name', 'e.surname', 'e.matriculation_number'])
    .having(sql`COUNT(w.id)`, '>=', 2)
    .orderBy('warning_count', 'desc')
    .limit(10)
    .execute();

  // Get top performers (most appreciations)
  const topPerformers = await db
    .selectFrom('appreciations as a')
    .innerJoin('employees as e', 'e.id', 'a.employee_id')
    .select([
      'e.id',
      'e.name',
      'e.surname',
      'e.matriculation_number',
    ])
    .select(sql<number>`COUNT(a.id)`.as('appreciation_count'))
    .where('a.appreciation_date', '>=', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    .where('e.employment_status', '=', 'active')
    .groupBy(['e.id', 'e.name', 'e.surname', 'e.matriculation_number'])
    .having(sql`COUNT(a.id)`, '>=', 3)
    .orderBy('appreciation_count', 'desc')
    .limit(10)
    .execute();

  // Get department statistics
  const departmentStats = await db
    .selectFrom('departments as d')
    .leftJoin('employees as e', (join) =>
      join
        .onRef('e.department_id', '=', 'd.id')
        .on('e.employment_status', '=', 'active')
    )
    .select([
      'd.name',
      'd.code',
    ])
    .select(sql<number>`COUNT(e.id)`.as('employee_count'))
    .groupBy(['d.id', 'd.name', 'd.code'])
    .orderBy('employee_count', 'desc')
    .execute();

  const reportCards = [
    {
      title: 'Expiring Licenses',
      description: 'Driving licenses expiring in next 30 days',
      icon: Shield,
      color: 'text-yellow-600',
      count: expiringLicenses.length,
      href: '/reports/expiring-licenses',
    },
    {
      title: 'Expiring Authorizations',
      description: 'Work permits expiring soon',
      icon: Calendar,
      color: 'text-orange-600',
      count: expiringAuthorizations.length,
      href: '/reports/expiring-authorizations',
    },
    {
      title: 'Pending Medical',
      description: 'Scheduled health visits',
      icon: Heart,
      color: 'text-red-600',
      count: pendingMedical.length,
      href: '/reports/medical-visits',
    },
    {
      title: 'Multiple Warnings',
      description: 'Employees with 2+ active warnings',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      count: multipleWarnings.length,
      href: '/reports/warnings',
    },
    {
      title: 'Top Performers',
      description: 'Employees with 3+ appreciations',
      icon: Award,
      color: 'text-green-600',
      count: topPerformers.length,
      href: '/reports/top-performers',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Icon className={`h-5 w-5 mr-2 ${card.color}`} />
                      {card.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {card.count}
                    </Badge>
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Expiring Licenses Report */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-yellow-600" />
                Expiring Driving Licenses
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expiringLicenses.length === 0 ? (
              <p className="text-gray-500">No licenses expiring in the next 30 days</p>
            ) : (
              <div className="space-y-2">
                {expiringLicenses.map((license) => (
                  <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Link href={`/employees/${(license as any).employee_id}`} className="font-medium hover:underline">
                        {license.name} {license.surname}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {license.matriculation_number} • License #{license.license_number}
                      </p>
                    </div>
                    <Badge variant={isExpired(license.expiry_date) ? 'destructive' : 'secondary'}>
                      Expires {formatDate(license.expiry_date)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Authorizations Report */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                Expiring Work Authorizations
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expiringAuthorizations.length === 0 ? (
              <p className="text-gray-500">No authorizations expiring in the next 30 days</p>
            ) : (
              <div className="space-y-2">
                {expiringAuthorizations.map((auth) => (
                  <div key={auth.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Link href={`/employees/${(auth as any).employee_id}`} className="font-medium hover:underline">
                        {auth.name} {auth.surname}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {auth.matriculation_number} • 
                        {auth.authorization_type === 'other' ? auth.custom_type_name : auth.authorization_type}
                      </p>
                    </div>
                    <Badge variant={isExpired(auth.expiry_date) ? 'destructive' : 'secondary'}>
                      Expires {formatDate(auth.expiry_date)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employees with Multiple Warnings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Employees with Multiple Warnings
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {multipleWarnings.length === 0 ? (
              <p className="text-gray-500">No employees with multiple active warnings</p>
            ) : (
              <div className="space-y-2">
                {multipleWarnings.map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Link href={`/employees/${employee.id}`} className="font-medium hover:underline">
                        {employee.name} {employee.surname}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {employee.matriculation_number}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-yellow-100">
                        {employee.warning_count} warnings
                      </Badge>
                      {employee.warning_count >= 3 && (
                        <Badge variant="destructive">Yellow Card</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Top Performers (Salary Increase Candidates)
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-gray-500">No employees with 3+ appreciations in the last year</p>
            ) : (
              <div className="space-y-2">
                {topPerformers.map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Link href={`/employees/${employee.id}`} className="font-medium hover:underline">
                        {employee.name} {employee.surname}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {employee.matriculation_number}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100">
                        {employee.appreciation_count} appreciations
                      </Badge>
                      <Badge variant="default" className="bg-green-600">
                        +3% Recommended
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Department Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {departmentStats.map((dept: any) => (
                <div key={dept.code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-gray-600">Code: {dept.code}</p>
                  </div>
                  <Badge variant="outline">
                    {dept.employee_count} employees
                  </Badge>
                </div>
              ))}
              {departmentStats.length === 0 && (
                <p className="text-gray-500">No departments found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}