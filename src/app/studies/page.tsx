"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, GraduationCap, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Study {
  id: string;
  employee_id: string;
  study_type: string;
  institution: string;
  specialization?: string;
  city?: string;
  country: string;
  start_date?: string;
  end_date?: string;
  has_diploma: boolean;
  diploma_series?: string;
  diploma_number?: string;
  diploma_date?: string;
  is_qualification_at_hire: boolean;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  surname: string;
  matriculation_number: string;
}

export default function StudiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    studyType: "bachelor",
    institution: "",
    specialization: "",
    city: "",
    country: "Romania",
    startDate: "",
    endDate: "",
    hasDiploma: false,
    diplomaSeries: "",
    diplomaNumber: "",
    diplomaDate: "",
    isQualificationAtHire: false,
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchStudies();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchStudies = async () => {
    try {
      const res = await fetch('/api/studies');
      const data = await res.json();
      setStudies(data);
    } catch (error) {
      console.error('Failed to fetch studies:', error);
      toast.error('Failed to load studies');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      // The API returns { employees: [], total: number }
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add study');
      }

      const newStudy = await res.json();
      setStudies([newStudy, ...studies]);
      setOpen(false);
      resetForm();
      toast.success('Study record added successfully');
    } catch (error) {
      console.error('Failed to add study:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add study');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      studyType: "bachelor",
      institution: "",
      specialization: "",
      city: "",
      country: "Romania",
      startDate: "",
      endDate: "",
      hasDiploma: false,
      diplomaSeries: "",
      diplomaNumber: "",
      diplomaDate: "",
      isQualificationAtHire: false,
      notes: ""
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
  };

  const getStudyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      primary: 'Primary',
      secondary: 'Secondary',
      high_school: 'High School',
      vocational: 'Vocational',
      bachelor: "Bachelor's",
      master: "Master's",
      doctorate: 'Doctorate',
      certification: 'Certification',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Studies & Education</h1>
          <p className="text-muted-foreground">Manage employee educational records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Study Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Study Record</DialogTitle>
              <DialogDescription>
                Add educational information for an employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} {employee.surname} ({employee.matriculation_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyType">Study Type *</Label>
                  <Select
                    value={formData.studyType}
                    onValueChange={(value) => setFormData({ ...formData, studyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                      <SelectItem value="bachelor">Bachelor's</SelectItem>
                      <SelectItem value="master">Master's</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDiploma"
                    checked={formData.hasDiploma}
                    onCheckedChange={(checked: boolean) => 
                      setFormData({ ...formData, hasDiploma: checked })
                    }
                  />
                  <Label htmlFor="hasDiploma">Has Diploma</Label>
                </div>

                {formData.hasDiploma && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diplomaSeries">Diploma Series</Label>
                      <Input
                        id="diplomaSeries"
                        value={formData.diplomaSeries}
                        onChange={(e) => setFormData({ ...formData, diplomaSeries: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diplomaNumber">Diploma Number</Label>
                      <Input
                        id="diplomaNumber"
                        value={formData.diplomaNumber}
                        onChange={(e) => setFormData({ ...formData, diplomaNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diplomaDate">Diploma Date</Label>
                      <Input
                        id="diplomaDate"
                        type="date"
                        value={formData.diplomaDate}
                        onChange={(e) => setFormData({ ...formData, diplomaDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isQualificationAtHire"
                    checked={formData.isQualificationAtHire}
                    onCheckedChange={(checked: boolean) => 
                      setFormData({ ...formData, isQualificationAtHire: checked })
                    }
                  />
                  <Label htmlFor="isQualificationAtHire">Qualification at Hire</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Study Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {studies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No study records found</p>
              <Button 
                onClick={() => setOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Add First Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          studies.map((study) => (
            <Card key={study.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {getStudyTypeLabel(study.study_type)} - {study.institution}
                    </CardTitle>
                    <CardDescription>
                      {getEmployeeName(study.employee_id)}
                    </CardDescription>
                  </div>
                  {study.has_diploma && (
                    <div className="text-sm text-green-600">Has Diploma</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {study.specialization && (
                    <div>
                      <p className="text-muted-foreground">Specialization</p>
                      <p className="font-medium">{study.specialization}</p>
                    </div>
                  )}
                  {study.city && (
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {study.city}, {study.country}
                      </p>
                    </div>
                  )}
                  {study.start_date && (
                    <div>
                      <p className="text-muted-foreground">Period</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(study.start_date).getFullYear()}
                        {study.end_date && ` - ${new Date(study.end_date).getFullYear()}`}
                      </p>
                    </div>
                  )}
                  {study.diploma_number && (
                    <div>
                      <p className="text-muted-foreground">Diploma</p>
                      <p className="font-medium">
                        {study.diploma_series && `${study.diploma_series} `}
                        {study.diploma_number}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}