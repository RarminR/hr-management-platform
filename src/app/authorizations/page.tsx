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
import { Plus, Shield, AlertCircle, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface Authorization {
  id: string;
  employee_id: string;
  authorization_type: string;
  custom_type_name?: string;
  authorization_number?: string;
  issued_by?: string;
  issued_date: string;
  expiry_date: string;
  is_suspended: boolean;
  suspension_reason?: string;
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

export default function AuthorizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    authorizationType: "forklift",
    customTypeName: "",
    authorizationNumber: "",
    issuedBy: "",
    issuedDate: "",
    expiryDate: "",
    isSuspended: false,
    suspensionReason: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchAuthorizations();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchAuthorizations = async () => {
    try {
      const res = await fetch('/api/authorizations');
      const data = await res.json();
      setAuthorizations(data);
    } catch (error) {
      console.error('Failed to fetch authorizations:', error);
      toast.error('Failed to load authorizations');
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
      const res = await fetch('/api/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add authorization');
      }

      await fetchAuthorizations();
      setOpen(false);
      resetForm();
      toast.success('Authorization added successfully');
    } catch (error) {
      console.error('Failed to add authorization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add authorization');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      authorizationType: "forklift",
      customTypeName: "",
      authorizationNumber: "",
      issuedBy: "",
      issuedDate: "",
      expiryDate: "",
      isSuspended: false,
      suspensionReason: "",
      notes: ""
    });
  };

  const getAuthTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      crane: 'Crane Operator',
      forklift: 'Forklift',
      nacelle: 'Nacelle',
      load_binder: 'Load Binder',
      transport_license: 'Transport License',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  if (status === "unauthenticated") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Authorizations & Licenses</h1>
          <p className="text-muted-foreground">Manage employee certifications and work permits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Authorization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Authorization</DialogTitle>
              <DialogDescription>
                Add a new certification or license for an employee
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
                  <Label htmlFor="authType">Authorization Type *</Label>
                  <Select
                    value={formData.authorizationType}
                    onValueChange={(value) => setFormData({ ...formData, authorizationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crane">Crane Operator</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="nacelle">Nacelle</SelectItem>
                      <SelectItem value="load_binder">Load Binder</SelectItem>
                      <SelectItem value="transport_license">Transport License</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.authorizationType === 'other' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="customTypeName">Custom Type Name</Label>
                    <Input
                      id="customTypeName"
                      value={formData.customTypeName}
                      onChange={(e) => setFormData({ ...formData, customTypeName: e.target.value })}
                      placeholder="Specify the authorization type"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="authNumber">Authorization Number</Label>
                  <Input
                    id="authNumber"
                    value={formData.authorizationNumber}
                    onChange={(e) => setFormData({ ...formData, authorizationNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuedBy">Issued By</Label>
                  <Input
                    id="issuedBy"
                    value={formData.issuedBy}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                    placeholder="Issuing organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuedDate">Issued Date *</Label>
                  <Input
                    id="issuedDate"
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSuspended"
                    checked={formData.isSuspended}
                    onCheckedChange={(checked: boolean) => 
                      setFormData({ ...formData, isSuspended: checked })
                    }
                  />
                  <Label htmlFor="isSuspended">Currently Suspended</Label>
                </div>

                {formData.isSuspended && (
                  <div className="space-y-2">
                    <Label htmlFor="suspensionReason">Suspension Reason</Label>
                    <Input
                      id="suspensionReason"
                      value={formData.suspensionReason}
                      onChange={(e) => setFormData({ ...formData, suspensionReason: e.target.value })}
                      placeholder="Reason for suspension"
                    />
                  </div>
                )}

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
                <Button type="submit">Add Authorization</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {authorizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No authorizations found</p>
              <Button 
                onClick={() => setOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Add First Authorization
              </Button>
            </CardContent>
          </Card>
        ) : (
          authorizations.map((auth) => (
            <Card key={auth.id} className={auth.is_suspended ? "border-orange-200" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {auth.authorization_type === 'other' && auth.custom_type_name 
                        ? auth.custom_type_name 
                        : getAuthTypeLabel(auth.authorization_type)}
                    </CardTitle>
                    <CardDescription>
                      {auth.name} {auth.surname} ({auth.matriculation_number})
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {auth.is_suspended && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                        Suspended
                      </span>
                    )}
                    {isExpired(auth.expiry_date) ? (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                        Expired
                      </span>
                    ) : isExpiringSoon(auth.expiry_date) ? (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        Expiring Soon
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        Valid
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {auth.authorization_number && (
                    <div>
                      <p className="text-muted-foreground">Number</p>
                      <p className="font-medium">{auth.authorization_number}</p>
                    </div>
                  )}
                  {auth.issued_by && (
                    <div>
                      <p className="text-muted-foreground">Issued By</p>
                      <p className="font-medium">{auth.issued_by}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Issued Date</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(auth.issued_date).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiry Date</p>
                    <p className={`font-medium flex items-center ${isExpired(auth.expiry_date) ? 'text-red-600' : isExpiringSoon(auth.expiry_date) ? 'text-yellow-600' : ''}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(auth.expiry_date).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>
                {auth.suspension_reason && (
                  <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                    <p className="text-orange-700">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Suspension Reason: {auth.suspension_reason}
                    </p>
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