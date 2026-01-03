"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    phone?: string;
    address?: string;
  };
  period: string;
  periodStart: string;
  periodEnd: string;
  studentCount: number;
  teacherCount?: number;
  baseFee: string;
  perStudentFee: string;
  featureFees: any;
  discount: string;
  tax: string;
  totalAmount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  paidBy: string | null;
  notes: string | null;
  dueDate: string;
  createdAt: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/super-admin/billing/invoices/${invoiceId}`
      );
      const data = await response.json();

      if (data.success) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || "Invoice not found");
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${parseFloat(amount).toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateSubtotal = () => {
    if (!invoice) return 0;
    return (
      parseFloat(invoice.baseFee) +
      parseFloat(invoice.perStudentFee) +
      parseFloat(invoice.discount)
    );
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invoice Not Found
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild>
              <Link href="/super-admin/billing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Billing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/super-admin/billing">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Billing
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Invoice details and payment information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(invoice.status)}
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Bill To
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{invoice.school.name}</p>
                      <p className="text-gray-600">{invoice.school.slug}</p>
                      <p className="text-gray-600">{invoice.school.email}</p>
                      {invoice.school.phone && (
                        <p className="text-gray-600">{invoice.school.phone}</p>
                      )}
                      {invoice.school.address && (
                        <p className="text-gray-600">
                          {invoice.school.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Invoice #:</span>
                        <span className="font-medium ml-2">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium ml-2">
                          {invoice.period}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Issue Date:</span>
                        <span className="font-medium ml-2">
                          {formatDate(invoice.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium ml-2">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Billing Breakdown */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Billing Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Base Plan Fee</span>
                      <span>
                        {formatCurrency(invoice.baseFee, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        ({invoice.studentCount} students ×{" "}
                        {formatCurrency(
                          invoice.perStudentFee,
                          invoice.currency
                        )}{" "}
                        each)
                      </span>
                      <span>
                        {formatCurrency(
                          invoice.perStudentFee,
                          invoice.currency
                        )}
                      </span>
                    </div>
                    {parseFloat(invoice.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>
                          -{formatCurrency(invoice.discount, invoice.currency)}
                        </span>
                      </div>
                    )}
                    {parseFloat(invoice.tax) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>
                          {formatCurrency(invoice.tax, invoice.currency)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount</span>
                      <span className="text-indigo-600">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {invoice.studentCount}
                    </div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {invoice.teacherCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatDate(invoice.periodStart)}
                    </div>
                    <div className="text-sm text-gray-600">Period Start</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatDate(invoice.periodEnd)}
                    </div>
                    <div className="text-sm text-gray-600">Period End</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    {getStatusBadge(invoice.status)}
                  </div>

                  {invoice.paidAt && (
                    <div className="flex items-center justify-between">
                      <span>Paid Date</span>
                      <span className="text-sm">
                        {formatDate(invoice.paidAt)}
                      </span>
                    </div>
                  )}

                  {invoice.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span>Method</span>
                      <span className="text-sm capitalize">
                        {invoice.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                  )}

                  {invoice.paymentReference && (
                    <div className="flex items-center justify-between">
                      <span>Reference</span>
                      <span className="text-sm font-mono">
                        {invoice.paymentReference}
                      </span>
                    </div>
                  )}

                  {invoice.paidBy && (
                    <div className="flex items-center justify-between">
                      <span>Processed By</span>
                      <span className="text-sm">{invoice.paidBy}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoice.status === "pending" && (
                  <Button className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Process Payment
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
