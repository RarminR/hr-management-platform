import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, ArrowLeft } from 'lucide-react';
import { employeesService } from '@/server/services/employees.service';

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get employees from database
  let employees: any[] = [];
  let error: string | null = null;
  
  try {
    const result = await employeesService.listEmployees({
      page: 1,
      limit: 50,
    });
    employees = result.employees;
  } catch (err) {
    console.error('Error fetching employees:', err);
    error = 'Failed to load employees';
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.name} ({session.user.role})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/employees/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Total: {employees.length} employees
          </div>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
              <CardDescription className="text-red-600">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first employee.</p>
                <Link href="/employees/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>Manage your organization's employees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matriculation</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">
                        {employee.matriculation_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {employee.name} {employee.surname}
                      </TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>{employee.department_id || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={employee.employment_status === 'active' ? 'default' : 'secondary'}
                        >
                          {employee.employment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}