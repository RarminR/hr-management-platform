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
import { Plus, Heart, Calendar, Stethoscope, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface HealthVisit {
  id: string;
  employee_id: string;
  visit_type: string;
  scheduled_date: string;
  performed_date?: string;
  medical_provider?: string;
  doctor_name?: string;
  fitness_result?: string;
  restrictions?: string;
  recommendations?: string;
  next_visit_date?: string;
  notes?: string;
  name?: string;
  surname?: string;
  matriculation_number?: string;
}

interface Employee {
  id: string;
  name: string;
  surname: string;
  matriculation_number: string;
}

export default function HealthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visits, setVisits] = useState<HealthVisit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    visitType: "periodic",
    scheduledDate: "",
    performedDate: "",
    medicalProvider: "",
    doctorName: "",
    fitnessResult: "",
    restrictions: "",
    recommendations: "",
    nextVisitDate: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchVisits();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Failed to fetch health visits:', error);
      toast.error('Failed to load health visits');
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
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add health visit');
      }

      await fetchVisits();
      setOpen(false);
      resetForm();
      toast.success('Health visit added successfully');
    } catch (error) {
      console.error('Failed to add health visit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add health visit');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      visitType: "periodic",
      scheduledDate: "",
      performedDate: "",
      medicalProvider: "",
      doctorName: "",
      fitnessResult: "",
      restrictions: "",
      recommendations: "",
      nextVisitDate: "",
      notes: ""
    });
  };

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hiring: 'Hiring Medical',
      periodic: 'Periodic Check',
      change_of_role: 'Role Change',
      return_to_work: 'Return to Work'
    };
    return labels[type] || type;
  };

  const getFitnessStatusColor = (status?: string) => {
    if (!status) return "";
    switch (status) {
      case 'fit': return "text-green-600 bg-green-50";
      case 'conditional': return "text-yellow-600 bg-yellow-50";
      case 'unfit': return "text-red-600 bg-red-50";
      default: return "";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Health & Medical</h1>
          <p className="text-muted-foreground">Manage occupational health visits and medical records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Health Visit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Health Visit</DialogTitle>
              <DialogDescription>
                Record a new occupational health visit
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
                  <Label htmlFor="visitType">Visit Type *</Label>
                  <Select
                    value={formData.visitType}
                    onValueChange={(value) => setFormData({ ...formData, visitType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hiring">Hiring Medical</SelectItem>
                      <SelectItem value="periodic">Periodic Check</SelectItem>
                      <SelectItem value="change_of_role">Role Change</SelectItem>
                      <SelectItem value="return_to_work">Return to Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performedDate">Performed Date</Label>
                  <Input
                    id="performedDate"
                    type="date"
                    value={formData.performedDate}
                    onChange={(e) => setFormData({ ...formData, performedDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalProvider">Medical Provider</Label>
                  <Input
                    id="medicalProvider"
                    value={formData.medicalProvider}
                    onChange={(e) => setFormData({ ...formData, medicalProvider: e.target.value })}
                    placeholder="Clinic or hospital name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fitnessResult">Fitness Result</Label>
                  <Select
                    value={formData.fitnessResult}
                    onValueChange={(value) => setFormData({ ...formData, fitnessResult: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                      <SelectItem value="unfit">Unfit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextVisitDate">Next Visit Date</Label>
                  <Input
                    id="nextVisitDate"
                    type="date"
                    value={formData.nextVisitDate}
                    onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="restrictions">Restrictions</Label>
                  <Input
                    id="restrictions"
                    value={formData.restrictions}
                    onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                    placeholder="Work restrictions if any"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Input
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    placeholder="Medical recommendations"
                  />
                </div>

                <div className="space-y-2 col-span-2">
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
                <Button type="submit">Add Health Visit</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {visits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No health visits found</p>
              <Button 
                onClick={() => setOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Add First Visit
              </Button>
            </CardContent>
          </Card>
        ) : (
          visits.map((visit) => (
            <Card key={visit.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      {getVisitTypeLabel(visit.visit_type)}
                    </CardTitle>
                    <CardDescription>
                      {visit.name} {visit.surname} ({visit.matriculation_number})
                    </CardDescription>
                  </div>
                  {visit.fitness_result && (
                    <span className={`text-sm px-2 py-1 rounded ${getFitnessStatusColor(visit.fitness_result)}`}>
                      {visit.fitness_result.toUpperCase()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(visit.scheduled_date).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  {visit.performed_date && (
                    <div>
                      <p className="text-muted-foreground">Performed Date</p>
                      <p className="font-medium">
                        {new Date(visit.performed_date).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  )}
                  {visit.medical_provider && (
                    <div>
                      <p className="text-muted-foreground">Medical Provider</p>
                      <p className="font-medium">{visit.medical_provider}</p>
                    </div>
                  )}
                  {visit.doctor_name && (
                    <div>
                      <p className="text-muted-foreground">Doctor</p>
                      <p className="font-medium">{visit.doctor_name}</p>
                    </div>
                  )}
                  {visit.next_visit_date && (
                    <div>
                      <p className="text-muted-foreground">Next Visit</p>
                      <p className="font-medium">
                        {new Date(visit.next_visit_date).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  )}
                </div>
                {(visit.restrictions || visit.recommendations) && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm space-y-1">
                    {visit.restrictions && (
                      <p>
                        <AlertCircle className="h-3 w-3 inline mr-1 text-yellow-600" />
                        <span className="font-medium">Restrictions:</span> {visit.restrictions}
                      </p>
                    )}
                    {visit.recommendations && (
                      <p>
                        <span className="font-medium">Recommendations:</span> {visit.recommendations}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}