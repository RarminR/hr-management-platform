import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Shield, 
  Heart, 
  Package, 
  AlertTriangle,
  ThumbsUp,
  FileText,
  Home,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit
} from 'lucide-react';
import { employeesService } from '@/server/services/employees.service';
import { studiesService } from '@/server/services/studies.service';
import { authorizationsService } from '@/server/services/authorizations.service';
import { healthService } from '@/server/services/health.service';
import { performanceService } from '@/server/services/performance.service';
import { formatDate, getExpiryStatus, getExpiryStatusText } from '@/lib/utils/date';
import { calculateAge } from '@/lib/utils/cnp-parser';

export default async function EmployeeDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  // Await params in Next.js 15+
  const { id } = await params;
  
  // Get employee data
  const employeeData = await employeesService.getEmployeeFullProfile(id);
  
  if (!employeeData) {
    notFound();
  }

  const { employee, emergencyContacts, children, department } = employeeData;

  // Get related data for all modules
  const [
    studies,
    professionalCourses,
    drivingLicenses,
    authorizations,
    medicalHistory,
    healthVisits,
    warnings,
    appreciations,
    behaviorNotes,
    performanceSummary
  ] = await Promise.all([
    studiesService.getEmployeeStudies(id),
    studiesService.getEmployeeProfessionalCourses(id),
    authorizationsService.getEmployeeDrivingLicenses(id),
    authorizationsService.getEmployeeAuthorizations(id),
    healthService.getEmployeeMedicalHistory(id),
    healthService.getEmployeeHealthVisits(id),
    performanceService.getEmployeeWarnings(id),
    performanceService.getEmployeeAppreciations(id),
    performanceService.getEmployeeBehaviorNotes(id),
    performanceService.getEmployeePerformanceSummary(id),
  ]);

  const age = calculateAge(employee.date_of_birth);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/employees">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Employees
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.name} {employee.surname}
              </h1>
              <Badge variant={employee.employment_status === 'active' ? 'default' : 'secondary'}>
                {employee.employment_status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/employees/${id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Employee
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Info Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Matriculation</p>
              <p className="font-mono font-semibold">{employee.matriculation_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CNP</p>
              <p className="font-mono">{employee.cnp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-semibold">{age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold">{department?.name || 'Not Assigned'}</p>
            </div>
          </div>
        </div>

        {/* Performance Alerts */}
        {(performanceSummary.warnings.yellowCards > 0 || 
          performanceSummary.appreciations.recommendsSalaryIncrease) && (
          <div className="mb-6 space-y-2">
            {performanceSummary.warnings.yellowCards > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-yellow-800">
                    {performanceSummary.warnings.yellowCards} Yellow Card{performanceSummary.warnings.yellowCards > 1 ? 's' : ''} 
                    ({performanceSummary.warnings.active} active warnings)
                  </span>
                </div>
              </div>
            )}
            {performanceSummary.appreciations.recommendsSalaryIncrease && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">
                    Recommended for salary increase (+3%) - {performanceSummary.appreciations.lastYear} appreciations in last year
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="studies">Studies</TabsTrigger>
            <TabsTrigger value="authorizations">Licenses</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="housing">Housing</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-gray-600">Date of Birth:</span>
                    <span className="text-sm font-medium">{formatDate(employee.date_of_birth)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-gray-600">Sex:</span>
                    <span className="text-sm font-medium">{employee.sex === 'M' ? 'Male' : 'Female'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-gray-600">Marital Status:</span>
                    <span className="text-sm font-medium capitalize">{employee.marital_status}</span>
                  </div>
                  {employee.spouse_name && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Spouse:</span>
                      <span className="text-sm font-medium">{employee.spouse_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              {(employee.address_street || employee.address_city) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      {employee.address_street && (
                        <p>
                          {employee.address_street} {employee.address_number}
                          {employee.address_block && `, Block ${employee.address_block}`}
                          {employee.address_staircase && `, Staircase ${employee.address_staircase}`}
                        </p>
                      )}
                      {employee.address_apartment && (
                        <p>
                          {employee.address_floor && `Floor ${employee.address_floor}, `}
                          Apartment {employee.address_apartment}
                        </p>
                      )}
                      {(employee.address_city || employee.address_county) && (
                        <p>
                          {employee.address_city}
                          {employee.address_city && employee.address_county && ', '}
                          {employee.address_county}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Employment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-gray-600">Hire Date:</span>
                    <span className="text-sm font-medium">
                      {employee.hire_date ? formatDate(employee.hire_date) : 'Not specified'}
                    </span>
                  </div>
                  {employee.termination_date && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Termination Date:</span>
                      <span className="text-sm font-medium">{formatDate(employee.termination_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              {emergencyContacts.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Emergency Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {emergencyContacts.map(contact => (
                        <div key={contact.id} className="border-l-2 border-gray-200 pl-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-gray-600">
                                {contact.relationship} • {contact.phone}
                                {contact.phone_secondary && ` • ${contact.phone_secondary}`}
                              </p>
                            </div>
                            {contact.is_primary && (
                              <Badge variant="outline">Primary</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Children */}
              {children.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Children
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {children.map(child => (
                        <div key={child.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{child.name}</p>
                            {child.date_of_birth && (
                              <p className="text-sm text-gray-600">
                                Born {formatDate(child.date_of_birth)} 
                                ({calculateAge(child.date_of_birth)} years old)
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Studies Tab */}
          <TabsContent value="studies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education & Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studies.length === 0 ? (
                  <p className="text-gray-500">No education records found</p>
                ) : (
                  <div className="space-y-4">
                    {studies.map(study => (
                      <div key={study.id} className="border-l-2 border-blue-200 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{study.institution}</p>
                            <p className="text-sm text-gray-600">
                              {study.specialization} • {study.study_type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {study.start_date && formatDate(study.start_date)} - 
                              {study.end_date ? formatDate(study.end_date) : 'Present'}
                            </p>
                          </div>
                          {study.has_diploma && (
                            <Badge variant="outline" className="bg-green-50">Diploma</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {professionalCourses.length === 0 ? (
                  <p className="text-gray-500">No professional courses found</p>
                ) : (
                  <div className="space-y-4">
                    {professionalCourses.map(course => (
                      <div key={course.id} className="border-l-2 border-purple-200 pl-4">
                        <p className="font-semibold">{course.course_name}</p>
                        <p className="text-sm text-gray-600">
                          {course.institution} • 
                          {course.end_date && ` ${formatDate(course.end_date)}`}
                          {course.paid_by_company && (
                            <Badge variant="outline" className="ml-2">Company Funded</Badge>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authorizations Tab */}
          <TabsContent value="authorizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Driving Licenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {drivingLicenses.length === 0 ? (
                  <p className="text-gray-500">No driving licenses found</p>
                ) : (
                  <div className="space-y-4">
                    {drivingLicenses.map(license => {
                      const status = getExpiryStatus(license.expiry_date);
                      return (
                        <div key={license.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">License #{license.license_number}</p>
                              <p className="text-sm text-gray-600">
                                Issued: {formatDate(license.issued_date)} • 
                                Expires: {formatDate(license.expiry_date)}
                              </p>
                            </div>
                            <Badge variant={
                              status === 'expired' ? 'destructive' : 
                              status === 'expiring-soon' ? 'secondary' : 
                              'default'
                            }>
                              {getExpiryStatusText(license.expiry_date)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Authorizations</CardTitle>
              </CardHeader>
              <CardContent>
                {authorizations.length === 0 ? (
                  <p className="text-gray-500">No work authorizations found</p>
                ) : (
                  <div className="space-y-4">
                    {authorizations.map(auth => {
                      const status = getExpiryStatus(auth.expiry_date);
                      return (
                        <div key={auth.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold capitalize">
                                {auth.authorization_type === 'other' ? auth.custom_type_name : auth.authorization_type}
                              </p>
                              <p className="text-sm text-gray-600">
                                {auth.authorization_number && `#${auth.authorization_number} • `}
                                Expires: {formatDate(auth.expiry_date)}
                              </p>
                            </div>
                            <Badge variant={
                              status === 'expired' ? 'destructive' : 
                              status === 'expiring-soon' ? 'secondary' : 
                              'default'
                            }>
                              {getExpiryStatusText(auth.expiry_date)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4">
            {session.user.role === 'admin' || session.user.role === 'hr' ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!medicalHistory ? (
                      <p className="text-gray-500">No medical history recorded</p>
                    ) : (
                      <div className="space-y-4">
                        {medicalHistory.blood_type && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600">Blood Type</p>
                            <p>{medicalHistory.blood_type}</p>
                          </div>
                        )}
                        {medicalHistory.chronic_conditions && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600">Chronic Conditions</p>
                            <p>{medicalHistory.chronic_conditions}</p>
                          </div>
                        )}
                        {medicalHistory.allergies && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600">Allergies</p>
                            <p>{medicalHistory.allergies}</p>
                          </div>
                        )}
                        {medicalHistory.work_restrictions && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600">Work Restrictions</p>
                            <p className="text-red-600">{medicalHistory.work_restrictions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Occupational Health Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {healthVisits.length === 0 ? (
                      <p className="text-gray-500">No health visits recorded</p>
                    ) : (
                      <div className="space-y-4">
                        {healthVisits.map(visit => (
                          <div key={visit.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold capitalize">{visit.visit_type} Visit</p>
                                <p className="text-sm text-gray-600">
                                  {visit.performed_date ? 
                                    `Performed: ${formatDate(visit.performed_date)}` : 
                                    `Scheduled: ${formatDate(visit.scheduled_date)}`
                                  }
                                </p>
                                {visit.fitness_result && (
                                  <p className="text-sm mt-1">
                                    Result: <Badge variant={
                                      visit.fitness_result === 'fit' ? 'default' :
                                      visit.fitness_result === 'conditional' ? 'secondary' :
                                      'destructive'
                                    }>{visit.fitness_result}</Badge>
                                  </p>
                                )}
                              </div>
                              {visit.next_visit_date && (
                                <Badge variant="outline">
                                  Next: {formatDate(visit.next_visit_date)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">
                    You don't have permission to view medical information
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{performanceSummary.warnings.active}</p>
                    <p className="text-sm text-gray-600">Active Warnings</p>
                    {performanceSummary.warnings.yellowCards > 0 && (
                      <p className="text-sm text-yellow-600 font-semibold mt-2">
                        {performanceSummary.warnings.yellowCards} Yellow Card(s)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <ThumbsUp className="h-5 w-5 mr-2 text-green-600" />
                    Appreciations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{performanceSummary.appreciations.lastYear}</p>
                    <p className="text-sm text-gray-600">Last 12 Months</p>
                    {performanceSummary.appreciations.recommendsSalaryIncrease && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        Salary Increase Recommended
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Behavior Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{performanceSummary.behaviorNotes.total}</p>
                    <p className="text-sm text-gray-600">Total Notes</p>
                    {performanceSummary.behaviorNotes.needsFollowUp > 0 && (
                      <p className="text-sm text-blue-600 font-semibold mt-2">
                        {performanceSummary.behaviorNotes.needsFollowUp} Need Follow-up
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Warnings */}
            {warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Warning History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {warnings.slice(0, 5).map(warning => (
                      <div key={warning.id} className="border-l-2 border-yellow-200 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{warning.reason}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(warning.warning_date)} • 
                              {warning.severity && ` ${warning.severity} • `}
                              {warning.issued_by}
                            </p>
                          </div>
                          {warning.is_active && warning.expiry_date && new Date(warning.expiry_date) > new Date() ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Expired</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Appreciations */}
            {appreciations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Appreciations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appreciations.slice(0, 5).map(appreciation => (
                      <div key={appreciation.id} className="border-l-2 border-green-200 pl-4">
                        <p className="font-medium">{appreciation.reason}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(appreciation.appreciation_date)} • 
                          {appreciation.reward_type && ` ${appreciation.reward_type} • `}
                          {appreciation.issued_by}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="assets">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">No assets assigned</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="housing">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">No housing records</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">No documents uploaded</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}