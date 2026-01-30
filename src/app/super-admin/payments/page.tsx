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
      "Students",
      "Base Salary",
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
          payment.baseSalary,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage and calculate monthly payments for all schools
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configure Base Salary</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Payment Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="baseSalary">Base Salary per Student (ETB)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    placeholder="50"
                    value={baseSalaryInput}
                    onChange={(e) => setBaseSalaryInput(e.target.value)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This is the base payment per active student per month
                  </p>
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
      </div>

      {/* Configuration Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Payment Configuration</h3>
                <p className="text-blue-700">
                  Base salary: <span className="font-bold">{formatCurrency(config?.baseSalary || 50)}</span> per student per month
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Last updated</div>
              <div className="text-sm font-medium text-blue-900">
                {config?.lastUpdated
                  ? new Date(config.lastUpdated).toLocaleDateString()
                  : "Never"
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{summary.totalSchools}</div>
                  <div className="text-sm text-gray-600">Total Schools</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{summary.totalStudents}</div>
                  <div className="text-sm text-gray-600">Active Students</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalPremiumCost)}
                  </div>
                  <div className="text-sm text-gray-600">Premium Features</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(summary.totalMonthlyPayment)}
                  </div>
                  <div className="text-sm text-gray-600">Total Monthly Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              School Payment Breakdown
            </span>
            <Badge variant="secondary" className="text-sm">
              {selectedPeriod}
            </Badge>
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
                      <div className="text-sm font-medium text-gray-600">Base Salary</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.baseSalary, payment.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(payment.baseSalary / payment.currentStudents, payment.currency)} × {payment.currentStudents} students
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
