"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface BillingData {
  calculation: {
    baseFee: number;
    featureFees: Array<{
      featureId: string;
      featureName: string;
      price: number;
      isEnabled: boolean;
    }>;
    totalFee: number;
    activeStudentCount: number;
    currency: string;
    breakdown: {
      baseCalculation: string;
      featureCalculation: string;
      total: string;
    };
    schoolName: string;
    schoolStatus: string;
    subscriptionStatus: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    createdAt: string;
    paymentMethod?: string;
    transactionId?: string;
  }>;
}

interface BillingDashboardProps {
  schoolId: string;
}

export function BillingDashboard({ schoolId }: BillingDashboardProps) {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, [schoolId]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Fetch current billing calculation
      const calcResponse = await fetch("/api/super-admin/billing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      let calculation = null;
      if (calcResponse.ok) {
        const calcData = await calcResponse.json();
        calculation = calcData.success ? calcData.calculation : null;
      }

      // Fetch payment history
      const paymentsResponse = await fetch(`/api/super-admin/billing/payments?schoolId=${schoolId}`);
      let payments = [];
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        payments = paymentsData.success ? paymentsData.payments : [];
      }

      setBillingData({ calculation, payments });
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const response = await fetch("/api/super-admin/billing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && billingData) {
          setBillingData({
            ...billingData,
            calculation: data.calculation,
          });
        }
      }
    } catch (error) {
      console.error("Failed to recalculate billing:", error);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!billingData?.calculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Billing Information Unavailable
          </CardTitle>
          <CardDescription>
            Unable to load billing information for this school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchBillingData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { calculation, payments } = billingData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Billing Dashboard</h3>
          <p className="text-sm text-gray-600">
            Manage billing and payment information
          </p>
        </div>
        <Button onClick={handleRecalculate} disabled={calculating}>
          {calculating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Recalculate
            </>
          )}
        </Button>
      </div>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculation.currency} {calculation.totalFee.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current billing period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculation.activeStudentCount}</div>
            <p className="text-xs text-muted-foreground">
              Students being billed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge
                variant={calculation.subscriptionStatus === 'active' ? 'default' : 'secondary'}
              >
                {calculation.subscriptionStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Billing cycle: {calculation.billingCycle}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(calculation.nextBillingDate).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-renewal date
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Billing Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of charges for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Base Fee</div>
                    <div className="text-sm text-gray-600">
                      {calculation.breakdown.baseCalculation}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {calculation.currency} {calculation.baseFee.toFixed(2)}
                    </div>
                  </div>
                </div>

                {calculation.featureFees.filter(f => f.price > 0).map((feature) => (
                  <div key={feature.featureId} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">{feature.featureName}</div>
                      <div className="text-sm text-gray-600">Additional feature</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {calculation.currency} {feature.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-bold text-lg">Total Amount</div>
                      <div className="text-sm text-gray-600">
                        {calculation.breakdown.total}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">
                        {calculation.currency} {calculation.totalFee.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enabled Features</CardTitle>
              <CardDescription>
                Features currently enabled for this school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculation.featureFees.map((feature) => (
                  <div
                    key={feature.featureId}
                    className={`p-4 border rounded-lg ${
                      feature.isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {feature.isEnabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{feature.featureName}</div>
                          {feature.price > 0 && (
                            <div className="text-sm text-gray-600">
                              +{calculation.currency} {feature.price.toFixed(2)}/month
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={feature.isEnabled ? "default" : "secondary"}>
                        {feature.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Recent payments and billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Payment History
                  </h3>
                  <p className="text-gray-600">
                    Payment history will appear here once payments are processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100' :
                          payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {payment.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {calculation.currency} {payment.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.billingPeriodStart).toLocaleDateString()} - {new Date(payment.billingPeriodEnd).toLocaleDateString()}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500">
                              TXN: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          payment.status === 'completed' ? 'default' :
                          payment.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {payment.status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

