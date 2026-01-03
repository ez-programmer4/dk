"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Calendar,
  Building2,
  CreditCard,
  TrendingUp,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/ui/LoadingSpinner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  schoolId: string;
  school: {
    id: string;
    name: string;
    slug: string;
    email: string;
  };
  period: string;
  totalAmount: string;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
}

export default function SuperAdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  });

  // Generate invoice form
  const [generateForm, setGenerateForm] = useState({
    schoolId: "",
    period: "",
  });

  // School selection
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [filteredSchools, setFilteredSchools] = useState<any[]>([]);

  // Fetch schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("/api/super-admin/schools?limit=100");
        const data = await response.json();
        if (data.success) {
          setSchools(data.schools);
          setFilteredSchools(data.schools);
        }
      } catch (error) {
        console.error("Failed to fetch schools:", error);
      }
    };
    fetchSchools();
  }, []);

  // Filter schools based on search
  useEffect(() => {
    if (!schoolSearchTerm) {
      setFilteredSchools(schools);
    } else {
      setFilteredSchools(
        schools.filter(
          (school) =>
            school.name
              .toLowerCase()
              .includes(schoolSearchTerm.toLowerCase()) ||
            school.slug
              .toLowerCase()
              .includes(schoolSearchTerm.toLowerCase()) ||
            school.email.toLowerCase().includes(schoolSearchTerm.toLowerCase())
        )
      );
    }
  }, [schoolSearchTerm, schools]);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "manual",
    paymentReference: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/super-admin/billing/invoices?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/super-admin/billing/invoices");
      const data = await response.json();

      if (data.success) {
        const invoices = data.invoices;
        const totalRevenue = invoices
          .filter((inv: Invoice) => inv.status === "paid")
          .reduce(
            (sum: number, inv: Invoice) => sum + parseFloat(inv.totalAmount),
            0
          );
        const pendingAmount = invoices
          .filter((inv: Invoice) => inv.status === "pending")
          .reduce(
            (sum: number, inv: Invoice) => sum + parseFloat(inv.totalAmount),
            0
          );
        const paidInvoices = invoices.filter(
          (inv: Invoice) => inv.status === "paid"
        ).length;
        const pendingInvoices = invoices.filter(
          (inv: Invoice) => inv.status === "pending"
        ).length;

        setStats({
          totalRevenue,
          pendingAmount,
          paidInvoices,
          pendingInvoices,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch("/api/super-admin/billing/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generateForm),
      });

      if (response.ok) {
        setIsGenerateModalOpen(false);
        setGenerateForm({ schoolId: "", period: "" });
        setSchoolSearchTerm("");
        fetchInvoices();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate invoice");
      }
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert("Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/super-admin/billing/invoices/${selectedInvoice.id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentForm),
        }
      );

      if (response.ok) {
        setIsPaymentModalOpen(false);
        setPaymentForm({
          paymentMethod: "manual",
          paymentReference: "",
          notes: "",
        });
        setSelectedInvoice(null);
        fetchInvoices();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Failed to process payment:", error);
      alert("Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get current month in YYYY-MM format
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Billing & Invoices
              </h1>
              <p className="text-gray-600 mt-1">
                Manage school billing and payments
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog
                open={isGenerateModalOpen}
                onOpenChange={setIsGenerateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGenerateInvoice} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolSearch">Select School *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="schoolSearch"
                          value={schoolSearchTerm}
                          onChange={(e) => setSchoolSearchTerm(e.target.value)}
                          placeholder="Search schools..."
                          className="pl-10"
                        />
                      </div>
                      {schoolSearchTerm && (
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {filteredSchools.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              No schools found
                            </div>
                          ) : (
                            filteredSchools.map((school) => (
                              <button
                                key={school.id}
                                type="button"
                                onClick={() => {
                                  setGenerateForm({
                                    ...generateForm,
                                    schoolId: school.id,
                                  });
                                  setSchoolSearchTerm(school.name);
                                }}
                                className="w-full p-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                              >
                                <div className="font-medium">{school.name}</div>
                                <div className="text-sm text-gray-500">
                                  {school.slug} • {school.email}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period">Billing Period *</Label>
                      <Input
                        id="period"
                        type="text"
                        value={generateForm.period}
                        onChange={(e) =>
                          setGenerateForm({
                            ...generateForm,
                            period: e.target.value,
                          })
                        }
                        placeholder={getCurrentPeriod()}
                        pattern="\d{4}-\d{2}"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Format: YYYY-MM (e.g., 2024-01)
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsGenerateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={generating}>
                        {generating ? "Generating..." : "Generate Invoice"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ${(stats.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +${(stats.pendingAmount || 0).toLocaleString()} pending
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  Paid Invoices
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.paidInvoices || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully processed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">
                  Pending Invoices
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {stats.pendingInvoices || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">
                  Failed Payments
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">0</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Billing Automation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Billing Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Auto Invoice Generation
                  </span>
                  <Switch defaultChecked />
                </div>
                <p className="text-xs text-gray-600">
                  Automatically generate invoices on the 1st of each month
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payment Reminders</span>
                  <Switch defaultChecked />
                </div>
                <p className="text-xs text-gray-600">
                  Send payment reminders 3 days before due date
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overdue Alerts</span>
                  <Switch />
                </div>
                <p className="text-xs text-gray-600">
                  Notify admins when payments become overdue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Pricing Tier</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices
                    .filter((inv) => {
                      if (!searchTerm) return true;
                      return (
                        inv.invoiceNumber
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        inv.school.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      );
                    })
                    .map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{invoice.invoiceNumber}</div>
                            <div className="text-xs text-gray-500">
                              {invoice.period}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {invoice.school.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.school.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(invoice.totalAmount).toLocaleString()}{" "}
                          {invoice.currency}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Tier Analysis
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => openPaymentModal(invoice)}
                              className="w-full"
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Invoice</div>
                <div className="font-semibold">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedInvoice.school.name} - {selectedInvoice.period}
                </div>
                <div className="text-lg font-bold mt-2">
                  {parseFloat(selectedInvoice.totalAmount).toLocaleString()}{" "}
                  {selectedInvoice.currency}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="manual">Manual Transaction</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference *</Label>
                <Input
                  id="paymentReference"
                  value={paymentForm.paymentReference}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentReference: e.target.value,
                    })
                  }
                  placeholder="Transaction ID, Receipt #, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
