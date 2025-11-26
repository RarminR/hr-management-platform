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
import { Plus, Package, Calendar, Hash, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  employee_id: string;
  inventory_item_id?: string;
  custom_name?: string;
  serial_number?: string;
  inventory_code?: string;
  accessories?: string;
  assigned_date: string;
  return_date?: string;
  expected_return_date?: string;
  value_at_assignment?: number;
  amortization_period_months?: number;
  condition_on_issue?: string;
  notes?: string;
  is_returned: boolean;
  employee_name?: string;
  employee_surname?: string;
  matriculation_number?: string;
  item_name?: string;
  item_category?: string;
  item_brand?: string;
}

interface Employee {
  id: string;
  name: string;
  surname: string;
  matriculation_number: string;
}

export default function AssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    inventoryItemId: "",
    customName: "",
    serialNumber: "",
    inventoryCode: "",
    accessories: "",
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: "",
    valueAtAssignment: "",
    amortizationPeriodMonths: "",
    conditionOnIssue: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchAssets();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load assets');
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
        valueAtAssignment: formData.valueAtAssignment ? parseFloat(formData.valueAtAssignment) : null,
        amortizationPeriodMonths: formData.amortizationPeriodMonths ? parseInt(formData.amortizationPeriodMonths) : null
      };

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to assign asset');
      }

      await fetchAssets();
      setOpen(false);
      resetForm();
      toast.success('Asset assigned successfully');
    } catch (error) {
      console.error('Failed to assign asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign asset');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      inventoryItemId: "",
      customName: "",
      serialNumber: "",
      inventoryCode: "",
      accessories: "",
      assignedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: "",
      valueAtAssignment: "",
      amortizationPeriodMonths: "",
      conditionOnIssue: "",
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
          <h1 className="text-3xl font-bold">Assets & Equipment</h1>
          <p className="text-muted-foreground">Manage company equipment and asset assignments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Assign Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Asset to Employee</DialogTitle>
              <DialogDescription>
                Assign equipment or assets to an employee
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

                <div className="space-y-2">
                  <Label htmlFor="customName">Asset Name *</Label>
                  <Input
                    id="customName"
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    placeholder="e.g., Laptop Dell XPS 13"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inventoryCode">Inventory Code</Label>
                  <Input
                    id="inventoryCode"
                    value={formData.inventoryCode}
                    onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
                    placeholder="e.g., IT-LAP-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Equipment serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessories">Accessories</Label>
                  <Input
                    id="accessories"
                    value={formData.accessories}
                    onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                    placeholder="e.g., Charger, mouse, bag"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedDate">Assigned Date *</Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={formData.assignedDate}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturnDate">Expected Return Date</Label>
                  <Input
                    id="expectedReturnDate"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueAtAssignment">Value (RON)</Label>
                  <Input
                    id="valueAtAssignment"
                    type="number"
                    step="0.01"
                    value={formData.valueAtAssignment}
                    onChange={(e) => setFormData({ ...formData, valueAtAssignment: e.target.value })}
                    placeholder="Asset value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amortizationPeriodMonths">Amortization (months)</Label>
                  <Input
                    id="amortizationPeriodMonths"
                    type="number"
                    value={formData.amortizationPeriodMonths}
                    onChange={(e) => setFormData({ ...formData, amortizationPeriodMonths: e.target.value })}
                    placeholder="e.g., 36"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditionOnIssue">Condition</Label>
                  <Select
                    value={formData.conditionOnIssue}
                    onValueChange={(value) => setFormData({ ...formData, conditionOnIssue: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button type="submit">Assign Asset</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assets assigned</p>
              <Button 
                onClick={() => setOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Assign First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {asset.item_name || asset.custom_name || 'Unknown Asset'}
                    </CardTitle>
                    <CardDescription>
                      {asset.employee_name} {asset.employee_surname} ({asset.matriculation_number})
                    </CardDescription>
                  </div>
                  {!asset.is_returned && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Active
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {asset.inventory_code && (
                    <div>
                      <p className="text-muted-foreground">Inventory Code</p>
                      <p className="font-medium flex items-center">
                        <Hash className="h-3 w-3 mr-1" />
                        {asset.inventory_code}
                      </p>
                    </div>
                  )}
                  {asset.serial_number && (
                    <div>
                      <p className="text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{asset.serial_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Assigned Date</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(asset.assigned_date).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  {asset.expected_return_date && (
                    <div>
                      <p className="text-muted-foreground">Expected Return</p>
                      <p className="font-medium">
                        {new Date(asset.expected_return_date).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  )}
                  {asset.value_at_assignment && (
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-medium flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {asset.value_at_assignment.toLocaleString('ro-RO')} RON
                      </p>
                    </div>
                  )}
                  {asset.condition_on_issue && (
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium capitalize">{asset.condition_on_issue}</p>
                    </div>
                  )}
                  {asset.accessories && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Accessories</p>
                      <p className="font-medium">{asset.accessories}</p>
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