"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface SchoolPayment {
  id: string;
  period: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'submitted';
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  transactionId?: string;
  bankAccount?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  studentCount: number;
  baseRate: number;
}

interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  pendingPayments: number;
  submittedPayments?: number;
  overduePayments: number;
  currency: string;
}

export default function SchoolPaymentsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const { toast } = useToast();

  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<SchoolPayment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment form state
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [schoolSlug]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      console.log(`Fetching payments for school: ${schoolSlug}`);

      const response = await fetch(`/api/admin/${schoolSlug}/school-payments`);

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to load payments",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedPayment || !transactionId.trim() || !selectedBank) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/${schoolSlug}/school-payments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          transactionId,
          bankAccount: selectedBank,
          notes: paymentNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Payment Submitted",
          description: "Your payment slip has been submitted for review",
        });
        setIsPaymentDialogOpen(false);
        setTransactionId("");
        setSelectedBank("");
        setPaymentNotes("");
        fetchPayments(); // Refresh the payments list
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.error || "Failed to submit payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit payment:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "ETB") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "submitted": return "bg-orange-100 text-orange-800 border-orange-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "submitted": return <Upload className="w-4 h-4" />;
      case "overdue": return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Payments</h1>
          <p className="text-gray-600 mt-1">
            View and manage your monthly payment obligations
          </p>
        </div>
      </motion.div>

      {/* Payment Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalDue, summary.currency)}
                  </div>
                  <div className="text-sm text-gray-600">Total Due</div>
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
                    {formatCurrency(summary.totalPaid, summary.currency)}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.pendingPayments}
                  </div>
                  <div className="text-sm text-gray-600">Pending Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.submittedPayments || 0}
                  </div>
                  <div className="text-sm text-gray-600">Submitted for Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.overduePayments}
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
              <Calendar className="w-5 h-5 mr-2" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                <p className="text-gray-600">
                  Your payment history will appear here once billing begins.
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
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            payment.status === 'paid' ? 'bg-green-100' :
                            payment.status === 'pending' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}
                        >
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payment.period} Payment
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          {payment.dueDate && (
                            <span className="text-sm text-gray-600">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        <div className="text-sm text-gray-600">per month</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-600">Active Students</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {payment.studentCount}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-600">Base Rate</div>
                        <div className="text-lg font-semibold text-blue-900">
                          {formatCurrency(payment.baseRate, payment.currency)}
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-600">Calculation</div>
                        <div className="text-lg font-semibold text-green-900">
                          {formatCurrency(payment.baseRate, payment.currency)} × {payment.studentCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {payment.status === 'paid' && payment.paidAt && (
                          <div className="text-sm text-gray-600">
                            Paid on {new Date(payment.paidAt).toLocaleDateString()}
                          </div>
                        )}

                      </div>

                      {payment.status !== 'paid' && (
                        <Button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsPaymentDialogOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Payment
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Submission Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              Submit Payment Slip
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Upload your payment slip for {selectedPayment?.period} billing period
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {selectedPayment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Period: {selectedPayment.period}</div>
                  <div>Amount: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</div>
                  {selectedPayment.dueDate && (
                    <div>Due Date: {new Date(selectedPayment.dueDate).toLocaleDateString()}</div>
                  )}
                  {selectedPayment.status === 'submitted' && selectedPayment.transactionId && (
                    <div>Transaction ID: {selectedPayment.transactionId}</div>
                  )}
                  {selectedPayment.status === 'submitted' && selectedPayment.bankAccount && (
                    <div>Bank Account: {selectedPayment.bankAccount === 'cbe' ? 'Commercial Bank of Ethiopia' : selectedPayment.bankAccount === 'telebirr' ? 'TeleBirr' : selectedPayment.bankAccount}</div>
                  )}
                  {selectedPayment.submittedAt && (
                    <div>Submitted: {new Date(selectedPayment.submittedAt).toLocaleDateString()} at {new Date(selectedPayment.submittedAt).toLocaleTimeString()}</div>
                  )}
                  {selectedPayment.approvedAt && (
                    <div>Approved: {new Date(selectedPayment.approvedAt).toLocaleDateString()} at {new Date(selectedPayment.approvedAt).toLocaleTimeString()}</div>
                  )}
                  {selectedPayment.approvalNotes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                      <strong>Approval Notes:</strong> {selectedPayment.approvalNotes}
                    </div>
                  )}
                </div>
              </div>
            )}


            <div>
              <Label htmlFor="bankAccount">Bank Account *</Label>
              <select
                id="bankAccount"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Bank Account</option>
                <option value="cbe">Commercial Bank of Ethiopia</option>
                <option value="telebirr">TeleBirr</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the bank account you used for payment
              </p>
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction/reference number"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Required: Transaction ID from your bank statement or receipt
              </p>
            </div>

            <div>
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Any additional notes about this payment"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitPayment}
                disabled={!transactionId.trim() || !selectedBank || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
