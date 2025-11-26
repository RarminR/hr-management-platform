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
import { Plus, FileText, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  entity_id: string;
  entity_type: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
  surname: string;
  matriculation_number: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    entityId: "",
    entityType: "employee",
    documentType: "contract",
    fileName: "",
    filePath: "",
    fileSize: null as number | null,
    mimeType: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchDocuments();
      fetchEmployees();
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
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
    
    // Simple file path validation
    if (!formData.filePath) {
      toast.error('Please provide a file path');
      return;
    }
    
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add document');
      }

      await fetchDocuments();
      setOpen(false);
      resetForm();
      toast.success('Document added successfully');
    } catch (error) {
      console.error('Failed to add document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add document');
    }
  };

  const resetForm = () => {
    setFormData({
      entityId: "",
      entityType: "employee",
      documentType: "contract",
      fileName: "",
      filePath: "",
      fileSize: null,
      mimeType: "",
      notes: ""
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_card: 'ID Card',
      diploma: 'Diploma',
      certificate: 'Certificate',
      medical_report: 'Medical Report',
      warning_document: 'Warning Document',
      authorization: 'Authorization',
      driving_license: 'Driving License',
      contract: 'Contract',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      id_card: 'bg-blue-100 text-blue-700',
      diploma: 'bg-purple-100 text-purple-700',
      certificate: 'bg-green-100 text-green-700',
      medical_report: 'bg-red-100 text-red-700',
      warning_document: 'bg-orange-100 text-orange-700',
      authorization: 'bg-indigo-100 text-indigo-700',
      driving_license: 'bg-teal-100 text-teal-700',
      contract: 'bg-gray-100 text-gray-700',
      other: 'bg-slate-100 text-slate-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getEmployeeName = (entityId: string) => {
    const employee = employees.find(e => e.id === entityId);
    return employee ? `${employee.name} ${employee.surname} (${employee.matriculation_number})` : entityId;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage employee documents and records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Add a new document record for an employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.entityId}
                    onValueChange={(value) => setFormData({ ...formData, entityId: value })}
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
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card">ID Card</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="medical_report">Medical Report</SelectItem>
                      <SelectItem value="warning_document">Warning Document</SelectItem>
                      <SelectItem value="authorization">Authorization</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileName">File Name *</Label>
                  <Input
                    id="fileName"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="e.g., employment_contract.pdf"
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="filePath">File Path *</Label>
                  <Input
                    id="filePath"
                    value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                    placeholder="Path to the document file"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mimeType">File Type</Label>
                  <Select
                    value={formData.mimeType}
                    onValueChange={(value) => setFormData({ ...formData, mimeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application/pdf">PDF</SelectItem>
                      <SelectItem value="image/jpeg">JPEG Image</SelectItem>
                      <SelectItem value="image/png">PNG Image</SelectItem>
                      <SelectItem value="application/msword">Word Document</SelectItem>
                      <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word (DOCX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileSize">File Size (bytes)</Label>
                  <Input
                    id="fileSize"
                    type="number"
                    value={formData.fileSize || ""}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Size in bytes"
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
                <Button type="submit">Add Document</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents found</p>
              <Button 
                onClick={() => setOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Add First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.file_name}
                    </CardTitle>
                    <CardDescription>
                      {doc.entity_type === 'employee' && getEmployeeName(doc.entity_id)}
                    </CardDescription>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getDocumentTypeColor(doc.document_type)}`}>
                    {getDocumentTypeLabel(doc.document_type)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {doc.file_path && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">File Path</p>
                      <p className="font-medium text-xs">{doc.file_path}</p>
                    </div>
                  )}
                  {doc.mime_type && (
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{doc.mime_type.split('/')[1]?.toUpperCase() || 'File'}</p>
                    </div>
                  )}
                  {doc.file_size && (
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">
                        {doc.file_size < 1024 
                          ? `${doc.file_size} B`
                          : doc.file_size < 1024 * 1024
                          ? `${(doc.file_size / 1024).toFixed(1)} KB`
                          : `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    </div>
                  )}
                  {doc.created_at && (
                    <div>
                      <p className="text-muted-foreground">Uploaded</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  )}
                </div>
                {doc.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{doc.notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}