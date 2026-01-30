"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  DollarSign,
  Users,
  Crown,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface PaymentCalculatorProps {
  selectedSchoolIds: string[];
  onClose: () => void;
}

interface PaymentCalculation {
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

interface CalculationResult {
  period: string;
  calculations: PaymentCalculation[];
  totals: {
    totalSchools: number;
    totalStudents: number;
    totalBaseSalary: number;
    totalPremiumCost: number;
    totalMonthlyPayment: number;
    currency: string;
  };
}

export default function PaymentCalculator({
  selectedSchoolIds,
  onClose,
}: PaymentCalculatorProps) {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const calculatePayments = async () => {
    if (selectedSchoolIds.length === 0) {
      setError("Please select at least one school");
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) throw new Error("No authentication token");

      const response = await fetch("/api/super-admin/payments/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolIds: selectedSchoolIds,
          period: selectedPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate payments");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate payments");
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "ETB") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!result) return;

    const headers = [
      "School Name",
      "Students",
      "Base Salary",
      "Premium Features Cost",
      "Total Monthly Payment",
      "Currency",
    ];

    const csvData = [
      headers.join(","),
      ...result.calculations.map(calc =>
        [
          `"${calc.schoolName}"`,
          calc.currentStudents,
          calc.baseSalary,
          calc.totalPremiumCost,
          calc.totalMonthlyPayment,
          calc.currency,
        ].join(",")
      ),
      [
        `"TOTALS"`,
        result.totals.totalStudents,
        result.totals.totalBaseSalary,
        result.totals.totalPremiumCost,
        result.totals.totalMonthlyPayment,
        result.totals.currency,
      ].join(","),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school-payments-${result.period}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Payment Calculator</h2>
                <p className="text-green-100 text-sm">
                  Calculate payments for {selectedSchoolIds.length} selected school{selectedSchoolIds.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Period Selector */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="period" className="text-sm font-medium text-gray-700">
                  Payment Period
                </Label>
                <p className="text-xs text-gray-500">Select the month for payment calculation</p>
              </div>
              <Input
                id="period"
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {!result ? (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Calculate Monthly Payments
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This will calculate the total monthly payment for selected schools based on their
                base salary plus any premium features they have enabled.
              </p>
              <Button
                onClick={calculatePayments}
                disabled={calculating || selectedSchoolIds.length === 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Schools</p>
                        <p className="text-xl font-bold">{result.totals.totalSchools}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-xl font-bold">{result.totals.totalStudents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Base Salary</p>
                        <p className="text-xl font-bold">{formatCurrency(result.totals.totalBaseSalary)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">Premium Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(result.totals.totalPremiumCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Total Payment */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Monthly Payment</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatCurrency(result.totals.totalMonthlyPayment)}
                    </div>
                    <p className="text-sm text-gray-600">For {result.period}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payment Breakdown</h3>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {result.calculations.map((calc) => (
                  <Card key={calc.schoolId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{calc.schoolName}</span>
                        <Badge variant="outline">{calc.pricingTier?.name || "No Tier"}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Students</p>
                          <p className="font-semibold">{calc.currentStudents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Base Salary</p>
                          <p className="font-semibold">{formatCurrency(calc.baseSalary, calc.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Premium Cost</p>
                          <p className="font-semibold">{formatCurrency(calc.totalPremiumCost, calc.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold text-lg">{formatCurrency(calc.totalMonthlyPayment, calc.currency)}</p>
                        </div>
                      </div>

                      {calc.premiumFeatures.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h4 className="font-medium mb-2">Premium Features</h4>
                            <div className="space-y-2">
                              {calc.premiumFeatures.map((feature) => (
                                <div key={feature.featureCode} className="flex justify-between items-center text-sm">
                                  <span>{feature.featureName}</span>
                                  <span className="text-gray-600">
                                    {formatCurrency(feature.costPerStudent)} × {calc.currentStudents} = {formatCurrency(feature.totalCost)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
