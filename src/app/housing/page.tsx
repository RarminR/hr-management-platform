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
import { Plus, Home, Calendar, DollarSign, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Housing {
  id: string;
  employee_id: string;
  address: string;
  housing_type?: string;
  start_date: string;
  end_date?: string;
  monthly_rent?: number;
  utilities_included: boolean;
  deposit_amount?: number;
  deposit_returned: boolean;
  notes?: string;
  is_active: boolean;
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

export default function HousingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [housing, setHousing] = useState<Housing[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    address: "",
    housingType: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    monthlyRent: "",
    utilitiesIncluded: false,
    depositAmount: "",
    depositReturned: false,
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchHousing();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchHousing = async () => {
    try {
      const res = await fetch('/api/housing');
      const data = await res.json();
      setHousing(data);
    } catch (error) {
      console.error('Failed to fetch housing:', error);
      toast.error('Failed to load housing records');
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
      const payload = {
        ...formData,
        monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : null,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null
      };

      const res = await fetch('/api/housing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add housing record');
      }

      await fetchHousing();
      setOpen(false);
      resetForm();
      toast.success('Housing record added successfully');
    } catch (error) {
      console.error('Failed to add housing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add housing record');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      address: "",
      housingType: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      monthlyRent: "",
      utilitiesIncluded: false,
      depositAmount: "",
      depositReturned: false,
      notes: ""
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Housing</h1>
          <p className="text-muted-foreground">Manage employee accommodation and housing records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Housing Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Housing Record</DialogTitle>
              <DialogDescription>
                Add accommodation details for an employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
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

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="housingType">Housing Type</Label>
                  <Select
                    value={formData.housingType}
                    onValueChange={(value) => setFormData({ ...formData, housingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="shared">Shared Accommodation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (RON)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    step="0.01"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    placeholder="Monthly rent amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
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

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (RON)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    placeholder="Security deposit"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="utilitiesIncluded"
                      checked={formData.utilitiesIncluded}
                      onCheckedChange={(checked: boolean) => 
                        setFormData({ ...formData, utilitiesIncluded: checked })
                      }
                    />
                    <Label htmlFor="utilitiesIncluded">Utilities Included</Label>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="depositReturned"
                      checked={formData.depositReturned}
                      onCheckedChange={(checked: boolean) => 
                        setFormData({ ...formData, depositReturned: checked })
                      }
                    />
                    <Label htmlFor="depositReturned">Deposit Returned</Label>
                  </div>
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
                <Button type="submit">Add Housing Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {housing.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No housing records found</p>
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
          housing.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {record.housing_type ? `${record.housing_type.charAt(0).toUpperCase() + record.housing_type.slice(1)}` : 'Accommodation'}
                    </CardTitle>
                    <CardDescription>
                      {record.name} {record.surname} ({record.matriculation_number})
                    </CardDescription>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${record.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {record.is_active ? 'Active' : 'Ended'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <p className="text-sm">{record.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(record.start_date).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    {record.end_date && (
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">
                          {new Date(record.end_date).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                    )}
                    {record.monthly_rent && (
                      <div>
                        <p className="text-muted-foreground">Monthly Rent</p>
                        <p className="font-medium flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {record.monthly_rent.toLocaleString('ro-RO')} RON
                          {record.utilities_included && (
                            <span className="ml-1 text-xs text-green-600">(utilities incl.)</span>
                          )}
                        </p>
                      </div>
                    )}
                    {record.deposit_amount && (
                      <div>
                        <p className="text-muted-foreground">Deposit</p>
                        <p className="font-medium">
                          {record.deposit_amount.toLocaleString('ro-RO')} RON
                          {record.deposit_returned && (
                            <span className="ml-1 text-xs text-green-600">(returned)</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}