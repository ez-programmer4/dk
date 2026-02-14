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
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [baseSalaryInput, setBaseSalaryInput] = useState("");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "students" | "payment">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  const formatCurrency = (amount: number, currency: string = "ETB") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPayments = payments
    .filter(payment =>
      payment.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-20" />
                  <div className="relative bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    School Payments
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Active student-based billing & premium features management
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="flex items-center space-x-3">
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="backdrop-blur-sm bg-white/50 hover:bg-white/70 border-gray-200 hover:border-gray-300 flex items-center space-x-2 shadow-lg">
                <Settings className="w-4 h-4" />
                <span>Configure Pricing</span>
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

          <Button
            onClick={exportToCSV}
            disabled={!payments.length}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Configuration Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
        <Card className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border-emerald-200 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20" />
                  <div className="relative bg-gradient-to-r from-emerald-500 to-blue-500 p-4 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Active Student Billing</h3>
                  <div className="space-y-1">
                    <p className="text-gray-700 flex items-center">
                      <span className="font-semibold text-lg">{formatCurrency(config?.baseSalary || 50)}</span>
                      <span className="mx-2">×</span>
                      <Users className="w-4 h-4 mr-1" />
                      <span className="font-medium">active students</span>
                      <span className="mx-2">=</span>
                      <span className="font-bold text-emerald-600">monthly payment</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Schools pay only for their currently active students, plus premium features
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm font-medium text-gray-600">Configuration Updated</div>
                <div className="text-lg font-bold text-gray-900">
                  {config?.lastUpdated
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
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="period" className="text-sm font-medium text-gray-700">
                  Payment Period
                </Label>
                <Input
                  id="period"
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="mt-1 w-40"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={calculatePayments}
                  disabled={calculating}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {calculating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Payments
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [sort, order] = value.split('-');
                setSortBy(sort as "name" | "students" | "payment");
                setSortOrder(order as "asc" | "desc");
              }}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="students-desc">Most Students</SelectItem>
                  <SelectItem value="students-asc">Least Students</SelectItem>
                  <SelectItem value="payment-desc">Highest Payment</SelectItem>
                  <SelectItem value="payment-asc">Lowest Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{summary.totalSchools}</div>
                  <div className="text-sm font-medium text-gray-600">Active Schools</div>
                  <div className="text-xs text-blue-600 mt-1">Paying customers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg border-green-200/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{summary.totalStudents.toLocaleString()}</div>
                  <div className="text-sm font-medium text-gray-600">Active Students</div>
                  <div className="text-xs text-green-600 mt-1">Billed students only</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg border-purple-200/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalPremiumCost)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Premium Add-ons</div>
                  <div className="text-xs text-purple-600 mt-1">Additional features</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-50 via-green-50 to-blue-50 border-emerald-200 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 via-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.totalMonthlyPayment)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Monthly Revenue</div>
                  <div className="text-xs text-emerald-600 mt-1 font-medium">💰 Total earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Active Student Billing Breakdown
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                {selectedPeriod}
              </Badge>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                Active Students Only
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <motion.div
                  key={payment.schoolId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: payment.pricingTier ? "#3B82F6" : "#6B7280" }}
                      >
                        {payment.schoolName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{payment.schoolName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{payment.currentStudents} active students</span>
                          {payment.pricingTier && (
                            <>
                              <span>•</span>
                              <Crown className="w-4 h-4" />
                              <span>{payment.pricingTier.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(payment.totalMonthlyPayment, payment.currency)}
                      </div>
                      <div className="text-sm text-gray-600">per month</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Base Rate × Active Students</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.baseSalary * payment.currentStudents, payment.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(payment.baseSalary, payment.currency)} × {payment.currentStudents} active students
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-600">Premium Features</div>
                      <div className="text-lg font-semibold text-blue-900">
                        {formatCurrency(payment.totalPremiumCost, payment.currency)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {payment.premiumFeatures.length} feature{payment.premiumFeatures.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-green-600">Total Payment</div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(payment.totalMonthlyPayment, payment.currency)}
                      </div>
                      <div className="text-xs text-green-600">
                        For {payment.period}
                      </div>
                    </div>
                  </div>

                  {payment.premiumFeatures.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Premium Features Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {payment.premiumFeatures.map((feature) => (
                            <div key={feature.featureCode} className="flex justify-between items-center text-sm p-2 bg-purple-50 rounded">
                              <span className="text-purple-900">{feature.featureName}</span>
                              <span className="font-medium text-purple-700">
                                {formatCurrency(feature.totalCost, payment.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
