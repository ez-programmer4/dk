"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Calculator,
  Settings,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Building2,
  Crown,
  BarChart3,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
  Eye,
  Clock,
  FileText,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface PaymentConfig {
  baseSalary: number;
  lastUpdated: string | null;
  currency: string;
}

interface SchoolPayment {
  schoolId: string;
  schoolName: string;
  currentStudents: number;
  pricingTier: {
    id: string;
    name: string;
    monthlyFee: number;
    currency: string;
    features: string[];
  } | null;
  baseSalary: number;
  premiumFeatures: {
    featureCode: string;
    featureName: string;
    costPerStudent: number;
    totalCost: number;
  }[];
  totalPremiumCost: number;
  totalMonthlyPayment: number;
  period: string;
  currency: string;
  paymentStatus?: 'none' | 'generated' | 'submitted' | 'approved' | 'paid' | 'overdue';
  lastPaymentDate?: string;
  daysOverdue?: number;
}

interface PaymentSummary {
  totalSchools: number;
  totalStudents: number;
  totalBaseSalary: number;
  totalPremiumCost: number;
  totalMonthlyPayment: number;
  currency: string;
}

export default function PaymentsPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    console.log('Initial selected period:', period);
    return period;
  });
  const [baseSalaryInput, setBaseSalaryInput] = useState("");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generatingPayments, setGeneratingPayments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "students" | "payment" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"all" | "none" | "generated" | "submitted" | "approved" | "overdue">("all");
  const [selectedSchoolForStudents, setSelectedSchoolForStudents] = useState<SchoolPayment | null>(null);
  const [schoolStudents, setSchoolStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchConfig(), calculatePayments()]);
      setLoading(false);
    };

    loadData();
  }, [selectedPeriod]);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        console.log("No auth token found, skipping config fetch");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/super-admin/payments/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setBaseSalaryInput(data.config.baseSalary.toString());
      } else {
        console.error("Config API returned error:", response.status);
        // Set default config if API fails
        setConfig({ baseSalary: 50, lastUpdated: null, currency: "ETB" });
        setBaseSalaryInput("50");
      }
    } catch (error) {
      console.error("Failed to fetch payment config:", error);
      // Set default config on error
      setConfig({ baseSalary: 50, lastUpdated: null, currency: "ETB" });
      setBaseSalaryInput("50");
    }
  };

  const calculatePayments = async () => {
    setCalculating(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        console.log("No auth token found, skipping payments calculation");
        setPayments([]);
        setSummary(null);
        return;
      }

      // Get all schools for calculation
      const schoolsResponse = await fetch("/api/super-admin/schools", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!schoolsResponse.ok) {
        console.error("Failed to fetch schools:", schoolsResponse.status);
        setPayments([]);
        setSummary(null);
        return;
      }

      const schoolsData = await schoolsResponse.json();
      const schoolIds = schoolsData.schools.map((school: any) => school.id);

      if (schoolIds.length === 0) {
        setPayments([]);
        setSummary(null);
        return;
      }

      const response = await fetch("/api/super-admin/payments/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolIds,
          period: selectedPeriod,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        console.log('Payment calculations with status:', data.calculations.map((s: SchoolPayment) => ({ name: s.schoolName, status: s.paymentStatus })));

        setPayments(data.calculations);
        setSummary(data.totals);
      } else {
        console.error("Payments calculation API returned error:", response.status);
        setPayments([]);
        setSummary(null);
      }
    } catch (error) {
      console.error("Failed to calculate payments:", error);
      setPayments([]);
      setSummary(null);
      toast({
        title: "Error",
        description: "Failed to calculate payments",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const updateBaseSalary = async () => {
    const salary = parseFloat(baseSalaryInput);
    if (isNaN(salary) || salary < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid salary amount",
        variant: "destructive",
      });
      return;
    }

    setSavingConfig(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch("/api/super-admin/payments/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseSalary: salary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setIsConfigDialogOpen(false);
        toast({
          title: "Success",
          description: "Base salary configuration updated successfully",
        });
        // Recalculate payments with new salary
        calculatePayments();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const generatePayments = async () => {
    setGeneratingPayments(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch("/api/super-admin/school-payments/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          period: generatePeriod,
          baseSalaryPerStudent: parseFloat(baseSalaryInput) || 50,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsGenerateDialogOpen(false);
        toast({
          title: "Payments Generated",
          description: `Successfully generated ${data.payments?.length || 0} payment records for ${data.payments?.length || 0} schools.`,
        });
        // Refresh the payments data
        calculatePayments();
      } else {
        const error = await response.json();
        toast({
          title: "Generation Failed",
          description: error.error || "Failed to generate payments",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate payments",
        variant: "destructive",
      });
    } finally {
      setGeneratingPayments(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "ETB") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "submitted": return "bg-orange-100 text-orange-800 border-orange-200";
      case "generated": return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      case "none": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case "approved": return "Approved";
      case "submitted": return "Submitted";
      case "generated": return "Generated";
      case "overdue": return "Overdue";
      case "none": return "No Payment";
      default: return "Unknown";
    }
  };

  const filteredPayments = payments
    .filter(payment => {
      // Text search filter
      const matchesSearch = payment.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || payment.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.schoolName;
          bValue = b.schoolName;
          break;
        case "students":
          aValue = a.currentStudents;
          bValue = b.currentStudents;
          break;
        case "payment":
          aValue = a.totalMonthlyPayment;
          bValue = b.totalMonthlyPayment;
          break;
        case "status":
          aValue = a.paymentStatus || 'none';
          bValue = b.paymentStatus || 'none';
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const fetchSchoolStudents = async (school: SchoolPayment) => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch(`/api/super-admin/schools/${school.schoolId}/students?status=active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchoolStudents(data.students || []);
        setSelectedSchoolForStudents(school);
        setIsStudentsDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to load student data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const exportToCSV = () => {
    if (!payments.length) return;

    const headers = [
      "School Name",
      "Active Students",
      "Base Rate per Student",
      "Total Base Payment",
      "Premium Features Cost",
      "Total Monthly Payment",
      "Currency",
      "Period"
    ];

    const csvData = [
      headers.join(","),
      ...payments.map(payment =>
        [
          `"${payment.schoolName}"`,
          payment.currentStudents,
          payment.baseSalary, // Per-student rate
          payment.baseSalary * payment.currentStudents, // Total base payment
          payment.totalPremiumCost,
          payment.totalMonthlyPayment,
          payment.currency,
          payment.period,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school-payments-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Payment data exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 via-blue-50/30 to-purple-50/40 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-100/20 to-indigo-100/20 rounded-full blur-3xl" />
      </div>

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-white/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 p-4 rounded-3xl shadow-2xl border border-white/20">
                    <DollarSign className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 bg-clip-text text-transparent">
                    Payment Management
                  </h1>
                  <p className="text-slate-600 text-base font-medium">
                    Active student billing & revenue optimization
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Real-time tracking</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Active monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex items-center space-x-3">
                <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="backdrop-blur-md bg-white/70 hover:bg-white/90 border-emerald-200/60 hover:border-emerald-400 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <div className="p-1 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                        <Settings className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">Configure Pricing</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                  Active Student Billing Configuration
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Set the base payment rate per active student. Schools pay only for students currently enrolled and active.
                </p>
              </DialogHeader>
              <div className="space-y-6">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Active Student Model</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Schools are billed only for their currently active students. Inactive or suspended students are not charged.
                  </p>
                </div>

                <div>
                  <Label htmlFor="baseSalary" className="text-base font-medium">
                    Base Rate per Active Student (ETB)
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    placeholder="50"
                    value={baseSalaryInput}
                    onChange={(e) => setBaseSalaryInput(e.target.value)}
                    className="mt-2 text-lg"
                    min="0"
                    step="0.01"
                  />
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Example Calculation:</strong><br />
                      School with 100 active students × {formatCurrency(parseFloat(baseSalaryInput) || 50)} per student<br />
                      <span className="font-bold text-blue-800">= {formatCurrency((parseFloat(baseSalaryInput) || 50) * 100)} monthly base payment</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsConfigDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateBaseSalary}
                    disabled={savingConfig}
                  >
                    {savingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

              <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="backdrop-blur-md bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 text-white flex items-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 group border border-white/20">
                    <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Generate Payments</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-emerald-600" />
                      Generate Monthly Payments
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Create payment records for all active schools based on their current active student counts.
                    </p>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-900">Payment Calculation</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Payments will be calculated as: Base Rate × Active Students + Premium Features (if any)
                      </p>
                      <div className="mt-2 text-sm font-medium text-emerald-800">
                        Current Base Rate: {formatCurrency(parseFloat(baseSalaryInput) || 50)} per student
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="generatePeriod">Billing Period</Label>
                      <Input
                        id="generatePeriod"
                        type="month"
                        value={generatePeriod}
                        onChange={(e) => setGeneratePeriod(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Select the month for which payments should be generated
                      </p>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">Important Notes</span>
                      </div>
                      <ul className="text-xs text-amber-700 mt-2 space-y-1">
                        <li>• Only active schools will receive payment records</li>
                        <li>• Existing payments for the same period will be skipped</li>
                        <li>• Schools can submit payment slips once records are created</li>
                        <li>• Premium features are automatically included in calculations</li>
                      </ul>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsGenerateDialogOpen(false)}
                        disabled={generatingPayments}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={generatePayments}
                        disabled={generatingPayments}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {generatingPayments ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" />
                            Generate Payments
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>

              <Button
                onClick={exportToCSV}
                disabled={!payments.length}
                variant="outline"
                className="backdrop-blur-md bg-white/70 hover:bg-white/90 border-blue-200/60 hover:border-blue-400 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">Export CSV</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Configuration Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative bg-gradient-to-br from-white via-emerald-50/40 via-cyan-50/30 to-blue-50/40 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-2xl" />

            <CardContent className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex items-center space-x-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 p-4 rounded-2xl shadow-2xl border border-white/20">
                      <DollarSign className="w-8 h-8 text-white drop-shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 bg-clip-text text-transparent">
                      Active Student Billing
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-gray-700">
                        <span className="font-bold text-2xl text-emerald-600">{formatCurrency(config?.baseSalary || 50)}</span>
                        <span className="text-lg">×</span>
                        <div className="flex items-center space-x-2 bg-emerald-100 px-3 py-1.5 rounded-full">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-emerald-800">active students</span>
                        </div>
                        <span className="text-lg">=</span>
                        <span className="font-bold text-xl text-transparent bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text">
                          monthly payment
                        </span>
                      </div>
                      <p className="text-slate-600 text-base leading-relaxed">
                        Schools pay only for their currently active students, plus premium features and add-ons
                      </p>
                    </div>
                  </div>
                </div>
              <div className="text-right space-y-1">
                <div className="text-sm font-medium text-gray-600">Configuration Updated</div>
                <div className="text-lg font-bold text-gray-900">
                  {config?.lastUpdated && config.lastUpdated
                    ? new Date(config.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : "Never"
                  }
                </div>
                <div className="flex items-center text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active student model
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Period Selector and Controls */}
      <Card className="relative backdrop-blur-md bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5" />
        <CardContent className="relative p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="space-y-2">
                <Label htmlFor="period" className="text-base font-semibold text-slate-700 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Payment Period</span>
                </Label>
                <Input
                  id="period"
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-48 h-11 bg-white/70 border-slate-200 hover:border-emerald-300 focus:border-emerald-400 transition-colors"
                />
              </div>
              <div className="flex items-center">
                <Button
                  onClick={calculatePayments}
                  disabled={calculating}
                  className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                >
                  {calculating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      <span className="font-semibold">Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Calculate Payments</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3 bg-white/60 px-4 py-2 rounded-xl border border-slate-200/60">
                <Search className="w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-700 placeholder-slate-400"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-44 h-11 bg-white/70 border-slate-200 hover:border-blue-300 focus:border-blue-400 transition-colors">
                  <Filter className="w-4 h-4 mr-2 text-blue-600" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="none">No Payment</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [sort, order] = value.split('-');
                setSortBy(sort as "name" | "students" | "payment" | "status");
                setSortOrder(order as "asc" | "desc");
              }}>
                <SelectTrigger className="w-44 h-11 bg-white/70 border-slate-200 hover:border-emerald-300 focus:border-emerald-400 transition-colors">
                  <BarChart3 className="w-4 h-4 mr-2 text-emerald-600" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="students-desc">Most Students</SelectItem>
                  <SelectItem value="students-asc">Least Students</SelectItem>
                  <SelectItem value="payment-desc">Highest Payment</SelectItem>
                  <SelectItem value="payment-asc">Lowest Payment</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="status-desc">Status Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      {summary && summary !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="relative backdrop-blur-md bg-gradient-to-br from-white/90 via-blue-50/50 to-cyan-50/50 hover:from-white hover:via-blue-50/70 hover:to-cyan-50/70 transition-all duration-500 hover:shadow-2xl border-0 shadow-xl group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-xl" />
            <CardContent className="relative p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur opacity-20" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {summary.totalSchools}
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Active Schools</div>
                  <div className="text-xs text-blue-600 font-medium flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse" />
                    Paying customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative backdrop-blur-md bg-gradient-to-br from-white/90 via-emerald-50/50 to-green-50/50 hover:from-white hover:via-emerald-50/70 hover:to-green-50/70 transition-all duration-500 hover:shadow-2xl border-0 shadow-xl group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-xl" />
            <CardContent className="relative p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl blur opacity-20" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {summary.totalStudents.toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Active Students</div>
                  <div className="text-xs text-emerald-600 font-medium flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                    Billed students only
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative backdrop-blur-md bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 hover:from-white hover:via-purple-50/70 hover:to-pink-50/70 transition-all duration-500 hover:shadow-2xl border-0 shadow-xl group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-xl" />
            <CardContent className="relative p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-20" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.totalPremiumCost)}
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Premium Add-ons</div>
                  <div className="text-xs text-purple-600 font-medium flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 animate-pulse" />
                    Additional features
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-emerald-50/80 via-blue-50/80 to-purple-50/80 border-0 backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-200/40 via-blue-200/40 to-purple-200/40 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/30 to-transparent rounded-full blur-xl" />
            <CardContent className="relative p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-xl blur opacity-30" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl border border-white/30">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.totalMonthlyPayment)}
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Monthly Revenue</div>
                  <div className="text-xs text-emerald-600 font-medium flex items-center">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mr-2 animate-pulse" />
                    💰 Total earnings
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Status Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {[
          { status: 'none', label: 'No Payment', icon: Clock, color: 'from-gray-500 to-gray-600', bgColor: 'from-gray-50 to-gray-100', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
          { status: 'generated', label: 'Generated', icon: FileText, color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
          { status: 'submitted', label: 'Submitted', icon: Upload, color: 'from-orange-500 to-orange-600', bgColor: 'from-orange-50 to-orange-100', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
          { status: 'approved', label: 'Approved', icon: CheckCircle, color: 'from-green-500 to-green-600', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-700' },
          { status: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'from-red-500 to-red-600', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-200', textColor: 'text-red-700' },
        ].map(({ status, label, icon: Icon, color, bgColor, borderColor, textColor }) => {
          const count = payments.filter(p => p.paymentStatus === status).length;
          const isSelected = statusFilter === status;
          return (
            <motion.div
              key={status}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`relative backdrop-blur-md bg-gradient-to-br ${bgColor} hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${borderColor} overflow-hidden group ${
                  isSelected ? 'ring-2 ring-blue-400 shadow-2xl border-blue-300 scale-105' : 'hover:border-gray-300'
                }`}
                onClick={() => setStatusFilter(isSelected ? 'all' : status as any)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="relative p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`relative w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg border border-white/20`}>
                      <Icon className="w-5 h-5 text-white" />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
                      <div className={`text-xs font-semibold ${textColor} uppercase tracking-wide opacity-80`}>{label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Payments Table */}
      <Card className="relative backdrop-blur-md bg-white/95 shadow-2xl hover:shadow-3xl transition-all duration-500 border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
        <CardHeader className="relative pb-4 pt-6">
          <CardTitle className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <span className="flex items-center text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg mr-3">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              Payment Records
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1.5 text-sm font-medium shadow-md">
                <Calendar className="w-3 h-3 mr-1" />
                {selectedPeriod}
              </Badge>
              <Badge variant="outline" className="bg-white/70 border-slate-200 text-slate-700 px-3 py-1.5 text-sm font-medium">
                <Building2 className="w-3 h-3 mr-1" />
                {filteredPayments.length} of {payments.length} schools
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {calculating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-gray-600">Calculating payments...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Data</h3>
              <p className="text-gray-600 mb-4">
                {payments.length === 0
                  ? "No schools found to calculate payments for"
                  : "No schools match your search criteria"
                }
              </p>
              {payments.length === 0 && (
                <Button onClick={calculatePayments} className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Payments
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPayments.map((payment, index) => (
                <motion.div
                  key={payment.schoolId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-gray-50/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative backdrop-blur-sm bg-white/90 hover:bg-white/95 shadow-lg hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      payment.paymentStatus === 'approved' ? 'bg-gradient-to-b from-green-500 to-emerald-500' :
                      payment.paymentStatus === 'submitted' ? 'bg-gradient-to-b from-orange-500 to-amber-500' :
                      payment.paymentStatus === 'generated' ? 'bg-gradient-to-b from-blue-500 to-cyan-500' :
                      payment.paymentStatus === 'overdue' ? 'bg-gradient-to-b from-red-500 to-rose-500' :
                      'bg-gradient-to-b from-gray-400 to-slate-500'
                    }`} />

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg border border-white/20"
                              style={{
                                background: payment.pricingTier
                                  ? 'linear-gradient(135deg, #10B981, #059669)'
                                  : 'linear-gradient(135deg, #6B7280, #4B5563)'
                              }}
                            >
                              {payment.schoolName.charAt(0).toUpperCase()}
                            </div>
                            {payment.pricingTier && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800">{payment.schoolName}</h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium">{payment.currentStudents} active students</span>
                              </div>
                              {payment.pricingTier && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-amber-600 font-medium">{payment.pricingTier.name}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`${getPaymentStatusColor(payment.paymentStatus)} border-0 shadow-sm`}>
                                {getPaymentStatusText(payment.paymentStatus)}
                              </Badge>
                              {payment.daysOverdue && payment.daysOverdue > 0 && (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {payment.daysOverdue} days overdue
                                </Badge>
                              )}
                              {payment.lastPaymentDate && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                  Last: {new Date(payment.lastPaymentDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            {formatCurrency(payment.totalMonthlyPayment, payment.currency)}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">per month</div>
                        </div>
                      </div>

                      <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200/60 hover:border-slate-300 transition-colors">
                          <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <div className="pr-10">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Base Payment</div>
                            <div className="text-xl font-bold text-slate-900 mb-1">
                              {formatCurrency(payment.baseSalary * payment.currentStudents, payment.currency)}
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                              {formatCurrency(payment.baseSalary, payment.currency)} × {payment.currentStudents} active students
                            </div>
                          </div>
                        </div>

                        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/60 hover:border-blue-300 transition-colors">
                          <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                          <div className="pr-10">
                            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Premium Features</div>
                            <div className="text-xl font-bold text-blue-900 mb-1">
                              {formatCurrency(payment.totalPremiumCost, payment.currency)}
                            </div>
                            <div className="text-xs text-blue-600">
                              {payment.premiumFeatures.length} feature{payment.premiumFeatures.length !== 1 ? 's' : ''} included
                            </div>
                          </div>
                        </div>

                        <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/60 hover:border-emerald-300 transition-colors">
                          <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="pr-10">
                            <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">Total Payment</div>
                            <div className="text-2xl font-bold text-emerald-900 mb-1">
                              {formatCurrency(payment.totalMonthlyPayment, payment.currency)}
                            </div>
                            <div className="text-xs text-emerald-600 font-medium">
                              For {payment.period}
                            </div>
                          </div>
                        </div>
                      </div>

                      {payment.premiumFeatures.length > 0 && (
                        <>
                          <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center">
                              <Crown className="w-4 h-4 mr-2 text-amber-600" />
                              Premium Features
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {payment.premiumFeatures.map((feature) => (
                                <div key={feature.featureCode} className="flex justify-between items-center text-sm p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
                                  <span className="text-amber-900 font-medium">{feature.featureName}</span>
                                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                                    {formatCurrency(feature.totalCost, payment.currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => fetchSchoolStudents(payment)}
                          disabled={loadingStudents}
                          className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          {loadingStudents ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Users className="w-4 h-4 mr-2" />
                          )}
                          <span className="font-medium">View Students ({payment.currentStudents})</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students List Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 border-0 shadow-2xl">
          <DialogHeader className="space-y-4 pb-6">
            <DialogTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              Active Students - {selectedSchoolForStudents?.schoolName}
            </DialogTitle>
            <p className="text-slate-600 text-base">
              Students billed for {selectedSchoolForStudents?.period} payment period
            </p>
          </DialogHeader>

          {selectedSchoolForStudents && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/40 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Total Students</span>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {schoolStudents.length}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900">Base Rate</span>
                      </div>
                      <div className="text-xl font-bold text-emerald-700">
                        {formatCurrency(selectedSchoolForStudents.baseSalary, selectedSchoolForStudents.currency)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Base Payment</span>
                      </div>
                      <div className="text-xl font-bold text-purple-700">
                        {formatCurrency(selectedSchoolForStudents.baseSalary * schoolStudents.length, selectedSchoolForStudents.currency)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-indigo-900">Period</span>
                      </div>
                      <div className="text-xl font-bold text-indigo-700">{selectedSchoolForStudents.period}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loadingStudents ? (
                <div className="flex items-center justify-center py-16">
                  <div className="relative">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur opacity-20" />
                  </div>
                  <span className="ml-4 text-lg text-slate-600 font-medium">Loading students...</span>
                </div>
              ) : schoolStudents.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-slate-200 rounded-2xl blur opacity-20" />
                    <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center w-full h-full">
                      <Users className="w-10 h-10 text-slate-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Students Found</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    No active students found for this school during the selected payment period.
                  </p>
                </div>
              ) : (
                <Card className="border-0 shadow-xl overflow-hidden bg-white/95">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-slate-600" />
                      Student Details
                    </h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Package
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Registration Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schoolStudents.map((student, index) => (
                          <motion.tr
                            key={student.wdt_ID}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                              {student.rigistral || student.wdt_ID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                              {student.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              <span className="bg-slate-100 px-2 py-1 rounded-md font-medium">
                                {student.package || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse" />
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                              {student.registrationdate
                                ? new Date(student.registrationdate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
