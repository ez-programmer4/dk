"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  Settings,
  CreditCard,
  BarChart3,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Crown,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading } from "@/components/ui/LoadingSpinner";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  subscriptionTier: string;
  maxStudents: number;
  currentStudentCount: number;
  billingCycle: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  planId: string | null;
  _count: {
    admins: number;
    teachers: number;
    students: number;
  };
  plan?: {
    id: string;
    name: string;
    basePrice: string;
    perStudentPrice: string;
    currency: string;
    maxStudents: number | null;
    maxTeachers: number | null;
    features: any;
  };
}

interface UsageData {
  currentPeriod: string;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  totalRevenue: number;
  lastUpdated: string;
}

export default function SchoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "",
    maxStudents: "",
  });
  const [planChangeForm, setPlanChangeForm] = useState({
    planId: "",
    effectiveDate: "",
    notes: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails();
      fetchUsageData();
      fetchPlans();
    }
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`);
      const data = await response.json();

      if (data.success) {
        setSchool(data.school);
        setEditForm({
          name: data.school.name,
          email: data.school.email,
          phone: data.school.phone || "",
          address: data.school.address || "",
          status: data.school.status,
          maxStudents: data.school.maxStudents.toString(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch school details:", error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const response = await fetch(`/api/super-admin/usage?schoolId=${schoolId}`);
      const data = await response.json();

      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/super-admin/plans?includeInactive=true");
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          status: editForm.status,
          maxStudents: parseInt(editForm.maxStudents),
        }),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchSchoolDetails();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update school");
      }
    } catch (error) {
      console.error("Failed to update school:", error);
      alert("Failed to update school");
    } finally {
      setUpdating(false);
    }
  };

  const handlePlanChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planChangeForm),
      });

      if (response.ok) {
        setIsPlanChangeModalOpen(false);
        setPlanChangeForm({ planId: "", effectiveDate: "", notes: "" });
        fetchSchoolDetails();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to change plan");
      }
    } catch (error) {
      console.error("Failed to change plan:", error);
      alert("Failed to change plan");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSubscriptionStatus = () => {
    if (!school) return null;

    const now = new Date();
    const trialEnds = school.trialEndsAt ? new Date(school.trialEndsAt) : null;
    const subscriptionEnds = school.subscriptionEndsAt ? new Date(school.subscriptionEndsAt) : null;

    if (trialEnds && now < trialEnds) {
      return {
        status: "trial",
        label: "Trial Period",
        color: "bg-blue-100 text-blue-800",
        daysLeft: Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    }

    if (subscriptionEnds && now < subscriptionEnds) {
      return {
        status: "active",
        label: "Active Subscription",
        color: "bg-green-100 text-green-800",
        daysLeft: Math.ceil((subscriptionEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    }

    return {
      status: "expired",
      label: "Subscription Expired",
      color: "bg-red-100 text-red-800",
      daysLeft: 0,
    };
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">School Not Found</h2>
          <p className="text-gray-600 mt-2">The requested school could not be found.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Schools
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
                <p className="text-gray-600 mt-1">Manage school details and subscription</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit School
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit School Details</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateSchool} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">School Name *</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-maxStudents">Max Students</Label>
                      <Input
                        id="edit-maxStudents"
                        type="number"
                        value={editForm.maxStudents}
                        onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updating}>
                        {updating ? "Updating..." : "Update School"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isPlanChangeModalOpen} onOpenChange={setIsPlanChangeModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Change Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Change Subscription Plan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePlanChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-select">New Plan *</Label>
                      <Select
                        value={planChangeForm.planId}
                        onValueChange={(value) => setPlanChangeForm({ ...planChangeForm, planId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a new plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans
                            .filter((p) => p.isActive)
                            .map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - {plan.basePrice} {plan.currency}/mo + {plan.perStudentPrice} {plan.currency} per student
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effective-date">Effective Date</Label>
                      <Input
                        id="effective-date"
                        type="date"
                        value={planChangeForm.effectiveDate}
                        onChange={(e) => setPlanChangeForm({ ...planChangeForm, effectiveDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-gray-500">Leave empty for immediate change</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="change-notes">Notes</Label>
                      <Textarea
                        id="change-notes"
                        value={planChangeForm.notes}
                        onChange={(e) => setPlanChangeForm({ ...planChangeForm, notes: e.target.value })}
                        placeholder="Reason for plan change..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsPlanChangeModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updating}>
                        {updating ? "Changing Plan..." : "Change Plan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {getStatusBadge(school.status)}
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(school.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{school._count.students}</div>
                  <p className="text-xs text-muted-foreground">
                    of {school.maxStudents} max
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {subscriptionStatus && (
                    <div>
                      <Badge className={subscriptionStatus.color}>
                        {subscriptionStatus.label}
                      </Badge>
                      {subscriptionStatus.daysLeft > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {subscriptionStatus.daysLeft} days remaining
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-medium">{school.plan?.name || "No Plan"}</div>
                  {school.plan && (
                    <p className="text-xs text-muted-foreground">
                      {school.plan.basePrice} {school.plan.currency}/mo
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* School Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-sm">{school.email}</p>
                  </div>
                  {school.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm">{school.phone}</p>
                    </div>
                  )}
                  {school.address && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Address</Label>
                      <p className="text-sm">{school.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">School Slug</Label>
                    <p className="text-sm font-mono">{school.slug}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">School ID</Label>
                    <p className="text-sm font-mono">{school.id}</p>
                  </div>
                  {school.stripeCustomerId && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Stripe Customer ID</Label>
                      <p className="text-sm font-mono">{school.stripeCustomerId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {school.plan ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Current Plan</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Plan Name:</span>
                          <span className="font-medium">{school.plan.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Base Price:</span>
                          <span>{school.plan.basePrice} {school.plan.currency}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Student:</span>
                          <span>{school.plan.perStudentPrice} {school.plan.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Max Students:</span>
                          <span>{school.plan.maxStudents || 'Unlimited'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Billing Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Billing Cycle:</span>
                          <span>{school.billingCycle}</span>
                        </div>
                        {subscriptionStatus && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={subscriptionStatus.color}>
                              {subscriptionStatus.label}
                            </Badge>
                          </div>
                        )}
                        {school.trialEndsAt && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Trial Ends:</span>
                            <span>{new Date(school.trialEndsAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {school.subscriptionEndsAt && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Subscription Ends:</span>
                            <span>{new Date(school.subscriptionEndsAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                    <p className="text-gray-600 mb-4">This school doesn't have an active subscription plan.</p>
                    <Button onClick={() => setIsPlanChangeModalOpen(true)}>
                      Assign Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {usage ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{usage.studentCount}</div>
                      <div className="text-sm text-gray-600">Students</div>
                    </div>
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{usage.teacherCount}</div>
                      <div className="text-sm text-gray-600">Teachers</div>
                    </div>
                    <div className="text-center">
                      <Settings className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{usage.adminCount}</div>
                      <div className="text-sm text-gray-600">Admins</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Usage data will be available once the school becomes active.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Management</h3>
                  <p className="text-gray-600 mb-4">School-specific settings will be available here.</p>
                  <Button variant="outline">
                    Manage Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

