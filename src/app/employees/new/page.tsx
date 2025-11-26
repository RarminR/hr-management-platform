'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, MapPin, CreditCard, Briefcase } from 'lucide-react';
import { parseCNP } from '@/lib/utils/cnp-parser';
import { formatDate } from '@/lib/utils/date';

export default function NewEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cnpError, setCnpError] = useState('');
  
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    surname: '',
    cnp: '',
    email: '',
    phone: '',
    
    // Address
    address_street: '',
    address_number: '',
    address_block: '',
    address_staircase: '',
    address_floor: '',
    address_apartment: '',
    address_city: '',
    address_county: '',
    
    // ID Card
    id_series: '',
    id_number: '',
    id_issued_date: '',
    id_issuer: '',
    
    // Family
    marital_status: 'single',
    spouse_name: '',
    
    // Employment
    department_id: '',
    hire_date: new Date().toISOString().split('T')[0],
  });

  const [cnpInfo, setCnpInfo] = useState<{
    dateOfBirth?: Date;
    sex?: 'M' | 'F';
    county?: string;
  }>({});

  const handleCNPChange = (value: string) => {
    setFormData(prev => ({ ...prev, cnp: value }));
    setCnpError('');
    
    if (value.length === 13) {
      const result = parseCNP(value);
      if (result.isValid) {
        setCnpInfo({
          dateOfBirth: result.dateOfBirth,
          sex: result.sex,
          county: result.county,
        });
        toast.success(`Valid CNP - Born: ${formatDate(result.dateOfBirth!)}, Sex: ${result.sex}, County: ${result.county}`);
      } else {
        setCnpError(result.error || 'Invalid CNP');
        setCnpInfo({});
      }
    } else {
      setCnpInfo({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cnpInfo.dateOfBirth) {
      setCnpError('Please enter a valid CNP');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id_issued_date: formData.id_issued_date || null,
          hire_date: formData.hire_date || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        if (data.details) {
          // Handle validation errors
          const errors = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
          throw new Error(`Validation failed: ${errors}`);
        }
        throw new Error(data.error || 'Failed to create employee');
      }

      toast.success(`Employee ${data.name} ${data.surname} created successfully!`);
      router.push('/employees');
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.message || 'Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <Link href="/employees">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>Basic employee details and identification</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">First Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="surname">Last Name *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="cnp">CNP (Personal Numeric Code) *</Label>
                <Input
                  id="cnp"
                  value={formData.cnp}
                  onChange={(e) => handleCNPChange(e.target.value)}
                  maxLength={13}
                  pattern="[0-9]{13}"
                  required
                  disabled={isLoading}
                  className={cnpError ? 'border-red-500' : ''}
                />
                {cnpError && <p className="text-sm text-red-600 mt-1">{cnpError}</p>}
                {cnpInfo.dateOfBirth && (
                  <p className="text-sm text-green-600 mt-1">
                    Date of Birth: {formatDate(cnpInfo.dateOfBirth)} | Sex: {cnpInfo.sex} | County: {cnpInfo.county}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address
              </CardTitle>
              <CardDescription>Residential address information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address_street">Street</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_number">Number</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_block">Block</Label>
                <Input
                  id="address_block"
                  value={formData.address_block}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_block: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_staircase">Staircase</Label>
                <Input
                  id="address_staircase"
                  value={formData.address_staircase}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_staircase: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_floor">Floor</Label>
                <Input
                  id="address_floor"
                  value={formData.address_floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_floor: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_apartment">Apartment</Label>
                <Input
                  id="address_apartment"
                  value={formData.address_apartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_apartment: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address_county">County</Label>
                <Input
                  id="address_county"
                  value={formData.address_county}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_county: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* ID Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                ID Card Information
              </CardTitle>
              <CardDescription>Official identification document details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="id_series">Series</Label>
                <Input
                  id="id_series"
                  value={formData.id_series}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_series: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="id_number">Number</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="id_issued_date">Issue Date</Label>
                <Input
                  id="id_issued_date"
                  type="date"
                  value={formData.id_issued_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_issued_date: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="id_issuer">Issued By</Label>
                <Input
                  id="id_issuer"
                  value={formData.id_issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_issuer: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Family & Employment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Family & Employment
              </CardTitle>
              <CardDescription>Family status and work information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="spouse_name">Spouse Name</Label>
                <Input
                  id="spouse_name"
                  value={formData.spouse_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, spouse_name: e.target.value }))}
                  disabled={isLoading || formData.marital_status !== 'married'}
                />
              </div>
              
              <div>
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employees')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !!cnpError || !formData.name || !formData.surname || !formData.cnp}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}