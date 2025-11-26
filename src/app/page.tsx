"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  AlertCircle, 
  FileWarning, 
  UserPlus,
  Building2,
  Calendar,
  Award,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface DashboardStats {
  employees: {
    total: number;
    active: number;
    recentHires: number;
  };
  departments: {
    total: number;
    byDepartment: { name: string; count: number }[];
  };
  alerts: {
    expiringAuthorizations: number;
    expiringMedical: number;
    recentWarnings: number;
    totalExpiring: number;
  };
  upcoming: {
    birthdays: { id: string; name: string; dateOfBirth: string }[];
  };
  recentActivity: {
    appreciations: { employee: string; reason: string; date: string }[];
  };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect('/auth/login');
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch('/api/dashboard/stats')
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch stats:', err);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name || 'User'}!</h1>
        <p className="text-blue-100">Here's what's happening in your HR system today.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employees.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.employees.active || 0} active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Documents</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.alerts.totalExpiring || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.alerts.expiringAuthorizations || 0} auth, {stats?.alerts.expiringMedical || 0} medical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Warnings</CardTitle>
            <FileWarning className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.alerts.recentWarnings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.employees.recentHires || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Department Distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Active employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.departments.byDepartment && stats.departments.byDepartment.length > 0 ? (
              <div className="space-y-4">
                {stats.departments.byDepartment.map((dept, idx) => (
                  <div key={idx} className="flex items-center">
                    <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{dept.name}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(dept.count / (stats?.employees.active || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-muted-foreground">{dept.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No department data available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/employees/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Employee
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/reports">
                <Activity className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/authorizations">
                <AlertCircle className="mr-2 h-4 w-4" />
                Check Expiring Docs
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/employees">
                <Users className="mr-2 h-4 w-4" />
                Employee Directory
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Birthdays</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcoming.birthdays && stats.upcoming.birthdays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcoming.birthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <p className="text-sm font-medium">{birthday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(birthday.dateOfBirth).toLocaleDateString('ro-RO', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/employees/${birthday.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming birthdays</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Appreciations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appreciations</CardTitle>
            <CardDescription>Recognition and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity.appreciations && stats.recentActivity.appreciations.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.appreciations.map((appreciation, idx) => (
                  <div key={idx} className="flex items-center">
                    <Award className="h-4 w-4 text-yellow-500 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appreciation.employee}</p>
                      <p className="text-xs text-muted-foreground">
                        {appreciation.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent appreciations</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}