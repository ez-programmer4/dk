"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Settings,
  TrendingUp,
  Layers,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingTier {
  id: string;
  minStudents: number;
  maxStudents: number | null; // null means unlimited
  basePrice: number;
  perStudentPrice: number;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  perStudentPrice: string;
  pricingTiers: PricingTier[] | null;
  currency: string;
  maxStudents: number | null;
  maxTeachers: number | null;
  maxStorage: number | null;
  features: any;
  billingCycles: any;
  trialDays: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
}

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    perStudentPrice: "",
    pricingTiers: [] as PricingTier[],
    currency: "ETB",
    maxStudents: "",
    maxTeachers: "",
    maxStorage: "",
    trialDays: "0",
    isActive: true,
    isPublic: true,
    features: {
      zoom: false,
      analytics: false,
      telegram: false,
      stripe: false,
      customBranding: false,
      advancedReports: false,
    },
    billingCycles: ["monthly"],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/super-admin/plans?includeInactive=true"
      );
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/super-admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...planForm,
          basePrice: parseFloat(planForm.basePrice),
          perStudentPrice: parseFloat(planForm.perStudentPrice),
          ...(planForm.pricingTiers.length > 0 && {
            pricingTiers: planForm.pricingTiers,
          }),
          maxStudents: planForm.maxStudents
            ? parseInt(planForm.maxStudents)
            : null,
          maxTeachers: planForm.maxTeachers
            ? parseInt(planForm.maxTeachers)
            : null,
          maxStorage: planForm.maxStorage
            ? parseInt(planForm.maxStorage)
            : null,
          trialDays: parseInt(planForm.trialDays),
        }),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      alert("Failed to create plan");
    } finally {
      setCreating(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      basePrice: plan.basePrice,
      perStudentPrice: plan.perStudentPrice,
      pricingTiers: plan.pricingTiers || [],
      currency: plan.currency,
      maxStudents: plan.maxStudents?.toString() || "",
      maxTeachers: plan.maxTeachers?.toString() || "",
      maxStorage: plan.maxStorage?.toString() || "",
      trialDays: plan.trialDays.toString(),
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      features: plan.features || {
        zoom: false,
        analytics: false,
        telegram: false,
        stripe: false,
        customBranding: false,
        advancedReports: false,
      },
      billingCycles: plan.billingCycles || ["monthly"],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/super-admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...planForm,
          basePrice: parseFloat(planForm.basePrice),
          perStudentPrice: parseFloat(planForm.perStudentPrice),
          ...(planForm.pricingTiers.length > 0 && {
            pricingTiers: planForm.pricingTiers,
          }),
          maxStudents: planForm.maxStudents
            ? parseInt(planForm.maxStudents)
            : null,
          maxTeachers: planForm.maxTeachers
            ? parseInt(planForm.maxTeachers)
            : null,
          maxStorage: planForm.maxStorage
            ? parseInt(planForm.maxStorage)
            : null,
          trialDays: parseInt(planForm.trialDays),
        }),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingPlan(null);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update plan");
      }
    } catch (error) {
      console.error("Failed to update plan:", error);
      alert("Failed to update plan");
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      perStudentPrice: "",
      pricingTiers: [],
      currency: "ETB",
      maxStudents: "",
      maxTeachers: "",
      maxStorage: "",
      trialDays: "0",
      isActive: true,
      isPublic: true,
      features: {
        zoom: false,
        analytics: false,
        telegram: false,
        stripe: false,
        customBranding: false,
        advancedReports: false,
      },
      billingCycles: ["monthly"],
    });
  };

  // Pricing tier management functions
  const addPricingTier = () => {
    const newTier: PricingTier = {
      id: Date.now().toString(),
      minStudents:
        planForm.pricingTiers.length === 0
          ? 1
          : (planForm.pricingTiers[planForm.pricingTiers.length - 1]
              .maxStudents || 0) + 1,
      maxStudents: null,
      basePrice: 0,
      perStudentPrice: 0,
      name: `Tier ${planForm.pricingTiers.length + 1}`,
    };
    setPlanForm({
      ...planForm,
      pricingTiers: [...planForm.pricingTiers, newTier],
    });
  };

  const updatePricingTier = (tierId: string, updates: Partial<PricingTier>) => {
    setPlanForm({
      ...planForm,
      pricingTiers: planForm.pricingTiers.map((tier) =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ),
    });
  };

  const removePricingTier = (tierId: string) => {
    setPlanForm({
      ...planForm,
      pricingTiers: planForm.pricingTiers.filter((tier) => tier.id !== tierId),
    });
  };

  // Calculate pricing for a given student count
  const calculateTierPrice = (tiers: PricingTier[], studentCount: number) => {
    const applicableTier = tiers
      .filter(
        (tier) =>
          tier.minStudents <= studentCount &&
          (tier.maxStudents === null || studentCount <= tier.maxStudents)
      )
      .sort((a, b) => b.minStudents - a.minStudents)[0];

    if (!applicableTier) return { basePrice: 0, perStudentPrice: 0, total: 0 };

    const extraStudents = Math.max(
      0,
      studentCount - applicableTier.minStudents + 1
    );
    const total =
      applicableTier.basePrice + extraStudents * applicableTier.perStudentPrice;

    return {
      basePrice: applicableTier.basePrice,
      perStudentPrice: applicableTier.perStudentPrice,
      total,
      tierName: applicableTier.name,
    };
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setPlanForm({ ...planForm, name, slug });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Subscription Plans
              </h1>
              <p className="text-gray-600 mt-1">
                Manage subscription plans and pricing
              </p>
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Plan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic Pricing</TabsTrigger>
                      <TabsTrigger value="tiers">Dynamic Tiers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Plan Name *</Label>
                          <Input
                            id="name"
                            value={planForm.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Basic Plan"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug">Slug *</Label>
                          <Input
                            id="slug"
                            value={planForm.slug}
                            onChange={(e) =>
                              setPlanForm({ ...planForm, slug: e.target.value })
                            }
                            placeholder="basic-plan"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={planForm.description}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Plan description..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="basePrice">Base Price *</Label>
                          <Input
                            id="basePrice"
                            type="number"
                            step="0.01"
                            value={planForm.basePrice}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                basePrice: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perStudentPrice">Per Student *</Label>
                          <Input
                            id="perStudentPrice"
                            type="number"
                            step="0.01"
                            value={planForm.perStudentPrice}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                perStudentPrice: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Input
                            id="currency"
                            value={planForm.currency}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                currency: e.target.value,
                              })
                            }
                            placeholder="ETB"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxStudents">Max Students</Label>
                          <Input
                            id="maxStudents"
                            type="number"
                            value={planForm.maxStudents}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                maxStudents: e.target.value,
                              })
                            }
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxTeachers">Max Teachers</Label>
                          <Input
                            id="maxTeachers"
                            type="number"
                            value={planForm.maxTeachers}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                maxTeachers: e.target.value,
                              })
                            }
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trialDays">Trial Days</Label>
                          <Input
                            id="trialDays"
                            type="number"
                            value={planForm.trialDays}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                trialDays: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Features</Label>
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={planForm.features.zoom}
                              onCheckedChange={(checked) =>
                                setPlanForm({
                                  ...planForm,
                                  features: {
                                    ...planForm.features,
                                    zoom: checked,
                                  },
                                })
                              }
                            />
                            <Label>Zoom Integration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={planForm.features.analytics}
                              onCheckedChange={(checked) =>
                                setPlanForm({
                                  ...planForm,
                                  features: {
                                    ...planForm.features,
                                    analytics: checked,
                                  },
                                })
                              }
                            />
                            <Label>Analytics</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={planForm.features.telegram}
                              onCheckedChange={(checked) =>
                                setPlanForm({
                                  ...planForm,
                                  features: {
                                    ...planForm.features,
                                    telegram: checked,
                                  },
                                })
                              }
                            />
                            <Label>Telegram Bot</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={planForm.features.stripe}
                              onCheckedChange={(checked) =>
                                setPlanForm({
                                  ...planForm,
                                  features: {
                                    ...planForm.features,
                                    stripe: checked,
                                  },
                                })
                              }
                            />
                            <Label>Stripe Payments</Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={planForm.isActive}
                            onCheckedChange={(checked) =>
                              setPlanForm({ ...planForm, isActive: checked })
                            }
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={planForm.isPublic}
                            onCheckedChange={(checked) =>
                              setPlanForm({ ...planForm, isPublic: checked })
                            }
                          />
                          <Label>Public (Visible to schools)</Label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="tiers" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">
                              Pricing Tiers
                            </h4>
                            <p className="text-sm text-gray-600">
                              Set different pricing based on student count
                              ranges
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPricingTier}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Tier
                          </Button>
                        </div>

                        {planForm.pricingTiers.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No pricing tiers configured</p>
                            <p className="text-sm">
                              Add tiers to enable dynamic pricing
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {planForm.pricingTiers.map((tier, index) => (
                              <Card key={tier.id} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                  <div className="space-y-2">
                                    <Label>Tier Name</Label>
                                    <Input
                                      value={tier.name}
                                      onChange={(e) =>
                                        updatePricingTier(tier.id, {
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="Basic Tier"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Min Students</Label>
                                    <Input
                                      type="number"
                                      value={tier.minStudents}
                                      onChange={(e) =>
                                        updatePricingTier(tier.id, {
                                          minStudents:
                                            parseInt(e.target.value) || 1,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Max Students</Label>
                                    <Input
                                      type="number"
                                      value={tier.maxStudents || ""}
                                      onChange={(e) =>
                                        updatePricingTier(tier.id, {
                                          maxStudents: e.target.value
                                            ? parseInt(e.target.value)
                                            : null,
                                        })
                                      }
                                      placeholder="Unlimited"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Base Price</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={tier.basePrice}
                                      onChange={(e) =>
                                        updatePricingTier(tier.id, {
                                          basePrice:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="space-y-2 flex-1">
                                      <Label>Per Student</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={tier.perStudentPrice}
                                        onChange={(e) =>
                                          updatePricingTier(tier.id, {
                                            perStudentPrice:
                                              parseFloat(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removePricingTier(tier.id)}
                                      className="mt-6"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Plan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Plans ({plans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-gray-500">
                            {plan.slug}
                          </div>
                          {plan.description && (
                            <div className="text-sm text-gray-400 mt-1">
                              {plan.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {plan.pricingTiers && plan.pricingTiers.length > 0 ? (
                            <div className="space-y-1">
                              <div className="font-medium text-blue-600">
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                Tiered Pricing
                              </div>
                              <div className="text-gray-500">
                                {plan.pricingTiers.length} tier
                                {plan.pricingTiers.length !== 1 ? "s" : ""}{" "}
                                configured
                              </div>
                              <div className="text-xs text-gray-400">
                                From {plan.pricingTiers[0]?.basePrice || 0}{" "}
                                {plan.currency}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">
                                {parseFloat(plan.basePrice).toLocaleString()}{" "}
                                {plan.currency}/mo
                              </div>
                              <div className="text-gray-500">
                                +{" "}
                                {parseFloat(
                                  plan.perStudentPrice
                                ).toLocaleString()}{" "}
                                {plan.currency} per student
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Students:{" "}
                            {plan.maxStudents ? plan.maxStudents : "Unlimited"}
                          </div>
                          <div>
                            Teachers:{" "}
                            {plan.maxTeachers ? plan.maxTeachers : "Unlimited"}
                          </div>
                          {plan.trialDays > 0 && (
                            <div className="text-blue-600">
                              Trial: {plan.trialDays} days
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.features?.zoom && (
                            <Badge variant="outline" className="text-xs">
                              Zoom
                            </Badge>
                          )}
                          {plan.features?.analytics && (
                            <Badge variant="outline" className="text-xs">
                              Analytics
                            </Badge>
                          )}
                          {plan.features?.telegram && (
                            <Badge variant="outline" className="text-xs">
                              Telegram
                            </Badge>
                          )}
                          {plan.features?.stripe && (
                            <Badge variant="outline" className="text-xs">
                              Stripe
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {plan.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {plan.isPublic && (
                            <Badge variant="outline" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePlan} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Pricing</TabsTrigger>
                <TabsTrigger value="tiers">Dynamic Tiers</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Plan Name *</Label>
                    <Input
                      id="edit-name"
                      value={planForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-slug">Slug *</Label>
                    <Input
                      id="edit-slug"
                      value={planForm.slug}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, slug: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Include all other form fields similar to create form */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={planForm.description}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Plan description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-basePrice">Base Price *</Label>
                    <Input
                      id="edit-basePrice"
                      type="number"
                      step="0.01"
                      value={planForm.basePrice}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          basePrice: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-perStudentPrice">Per Student *</Label>
                    <Input
                      id="edit-perStudentPrice"
                      type="number"
                      step="0.01"
                      value={planForm.perStudentPrice}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          perStudentPrice: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-trialDays">Trial Days</Label>
                    <Input
                      id="edit-trialDays"
                      type="number"
                      value={planForm.trialDays}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          trialDays: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.zoom}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, zoom: checked },
                          })
                        }
                      />
                      <Label>Zoom Integration</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.analytics}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: {
                              ...planForm.features,
                              analytics: checked,
                            },
                          })
                        }
                      />
                      <Label>Analytics</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.telegram}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: {
                              ...planForm.features,
                              telegram: checked,
                            },
                          })
                        }
                      />
                      <Label>Telegram Bot</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.stripe}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: {
                              ...planForm.features,
                              stripe: checked,
                            },
                          })
                        }
                      />
                      <Label>Stripe Payments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.customBranding}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: {
                              ...planForm.features,
                              customBranding: checked,
                            },
                          })
                        }
                      />
                      <Label>Custom Branding</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={planForm.features.advancedReports}
                        onCheckedChange={(checked) =>
                          setPlanForm({
                            ...planForm,
                            features: {
                              ...planForm.features,
                              advancedReports: checked,
                            },
                          })
                        }
                      />
                      <Label>Advanced Reports</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={planForm.isActive}
                      onCheckedChange={(checked) =>
                        setPlanForm({ ...planForm, isActive: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={planForm.isPublic}
                      onCheckedChange={(checked) =>
                        setPlanForm({ ...planForm, isPublic: checked })
                      }
                    />
                    <Label>Public (Visible to schools)</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tiers" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Pricing Tiers</h4>
                      <p className="text-sm text-gray-600">
                        Set different pricing based on student count ranges
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPricingTier}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>

                  {planForm.pricingTiers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pricing tiers configured</p>
                      <p className="text-sm">
                        Add tiers to enable dynamic pricing
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {planForm.pricingTiers.map((tier, index) => (
                        <Card key={tier.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-2">
                              <Label>Tier Name</Label>
                              <Input
                                value={tier.name}
                                onChange={(e) =>
                                  updatePricingTier(tier.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Basic Tier"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Min Students</Label>
                              <Input
                                type="number"
                                value={tier.minStudents}
                                onChange={(e) =>
                                  updatePricingTier(tier.id, {
                                    minStudents: parseInt(e.target.value) || 1,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Students</Label>
                              <Input
                                type="number"
                                value={tier.maxStudents || ""}
                                onChange={(e) =>
                                  updatePricingTier(tier.id, {
                                    maxStudents: e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  })
                                }
                                placeholder="Unlimited"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Base Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={tier.basePrice}
                                onChange={(e) =>
                                  updatePricingTier(tier.id, {
                                    basePrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="space-y-2 flex-1">
                                <Label>Per Student</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={tier.perStudentPrice}
                                  onChange={(e) =>
                                    updatePricingTier(tier.id, {
                                      perStudentPrice:
                                        parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePricingTier(tier.id)}
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlan(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
