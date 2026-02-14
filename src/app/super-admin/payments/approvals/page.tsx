"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface PaymentApproval {
  id: string;
  period: string;
  amount: number;
  currency: string;
  studentCount: number;
  baseFee: number;
  transactionId: string;
  bankAccount: string;
  notes: string;
  submittedAt: string;
  school: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Statistics {
  submitted: number;
  paid: number;
  pending: number;
  overdue: number;
}

export default function PaymentApprovalsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentApproval[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentApproval | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/super-admin/payments/approvals");

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setStatistics(data.statistics || null);
      } else {
        toast({
          title: "Error",
          description: "Failed to load payment approvals",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
      toast({
        title: "Error",
        description: "Failed to load payment approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBankName = (bankAccount: string) => {
    switch (bankAccount) {
      case "cbe": return "Commercial Bank of Ethiopia";
      case "telebirr": return "TeleBirr";
      default: return bankAccount;
    }
  };

  const handleApproval = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/super-admin/payments/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action: approvalAction,
          notes: approvalNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: approvalAction === "approve"
            ? "Payment approved successfully"
            : "Payment rejected and returned to school",
        });
        setIsApprovalDialogOpen(false);
        setSelectedPayment(null);
        setApprovalNotes("");
        fetchApprovals(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to process payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve school payment submissions
          </p>
        </div>
      </motion.div>

      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.submitted}
                  </div>
                  <div className="text-sm text-gray-600">Pending Approval</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.paid}
                  </div>
                  <div className="text-sm text-gray-600">Approved Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.pending}
                  </div>
                  <div className="text-sm text-gray-600">Unpaid Bills</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.overdue}
                  </div>
                  <div className="text-sm text-gray-600">Overdue Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Pending Approvals ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  No payment submissions waiting for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payment.school.name}
                          </h3>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Submitted
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Period: {payment.period}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {getBankName(payment.bankAccount)}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            TXN: {payment.transactionId}
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-600">
                          <div>Transaction ID: <span className="font-medium">{payment.transactionId}</span></div>
                          <div>Students: <span className="font-medium">{payment.studentCount}</span></div>
                          <div>Submitted: <span className="font-medium">
                            {new Date(payment.submittedAt).toLocaleDateString()} at {new Date(payment.submittedAt).toLocaleTimeString()}
                          </span></div>
                        </div>

                        {payment.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>Notes:</strong> {payment.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setApprovalAction("approve");
                            setIsApprovalDialogOpen(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setApprovalAction("reject");
                            setIsApprovalDialogOpen(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {approvalAction === "approve" ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
              )}
              {approvalAction === "approve" ? "Approve" : "Reject"} Payment
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              {approvalAction === "approve"
                ? "Confirm payment approval for this school"
                : "Reject this payment and return it to the school for correction"
              }
            </p>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>School: {selectedPayment.school.name}</div>
                  <div>Period: {selectedPayment.period}</div>
                  <div>Amount: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</div>
                  <div>Bank: {getBankName(selectedPayment.bankAccount)}</div>
                  <div>Transaction ID: {selectedPayment.transactionId}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="approvalNotes">
                  {approvalAction === "approve" ? "Approval" : "Rejection"} Notes (Optional)
                </Label>
                <Textarea
                  id="approvalNotes"
                  placeholder={
                    approvalAction === "approve"
                      ? "Add any notes about this approval..."
                      : "Explain why this payment was rejected..."
                  }
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsApprovalDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApproval}
                  disabled={processing}
                  className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalAction === "approve" ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      {approvalAction === "approve" ? "Approve" : "Reject"} Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
