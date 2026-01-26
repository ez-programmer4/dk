"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Settings,
  Eye,
  Star,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  Receipt,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  slug: string;
  baseSalaryPerStudent: number;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  planFeatures: Array<{
    id: string;
    price: number;
    isEnabled: boolean;
    feature: {
      id: string;
      name: string;
      description?: string;
      code: string;
      isCore: boolean;
    };
  }>;
  _count: {
    subscriptions: number;
  };
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  code: string;
  isCore: boolean;
  isActive: boolean;
}

export function PricingManagement() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");

  // Plan creation state
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    slug: "",
    baseSalaryPerStudent: "",
    currency: "ETB",
    isDefault: false,
    features: [] as Array<{ id: string; price: string; isEnabled: boolean }>,
  });

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [editPlan, setEditPlan] = useState({
    name: "",
    description: "",
    baseSalaryPerStudent: "",
    currency: "ETB",
    isActive: true,
    isDefault: false,
    features: [] as Array<{ id: string; price: string; isEnabled: boolean }>,
  });

  // Feature creation state
  const [showCreateFeature, setShowCreateFeature] = useState(false);
  const [creatingFeature, setCreatingFeature] = useState(false);
  const [newFeature, setNewFeature] = useState({
    name: "",
    description: "",
    code: "",
    isCore: false,
  });

  useEffect(() => {
    fetchPlans();
    fetchFeatures();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/super-admin/pricing/plans");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/super-admin/pricing/features");
      const data = await response.json();
      if (data.success) {
        setFeatures(data.features);
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.slug || !newPlan.baseSalaryPerStudent) {
      alert("Please fill in all required fields");
      return;
    }

    setCreatingPlan(true);
    try {
      const response = await fetch("/api/super-admin/pricing/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newPlan,
          baseSalaryPerStudent: parseFloat(newPlan.baseSalaryPerStudent),
          features: newPlan.features.map(f => ({
            id: f.id,
            price: parseFloat(f.price),
            isEnabled: f.isEnabled,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreatePlan(false);
        setNewPlan({
          name: "",
          description: "",
          slug: "",
          baseSalaryPerStudent: "",
          currency: "ETB",
          features: [],
        });
        fetchPlans();
      } else {
        alert(data.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      alert("Failed to create plan");
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleCreateFeature = async () => {
    if (!newFeature.name || !newFeature.code) {
      alert("Please fill in all required fields");
      return;
    }

    setCreatingFeature(true);
    try {
      const response = await fetch("/api/super-admin/pricing/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFeature),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateFeature(false);
        setNewFeature({
          name: "",
          description: "",
          code: "",
          isCore: false,
        });
        fetchFeatures();
        fetchPlans(); // Refresh plans to show new features
      } else {
        alert(data.error || "Failed to create feature");
      }
    } catch (error) {
      console.error("Failed to create feature:", error);
      alert("Failed to create feature");
    } finally {
      setCreatingFeature(false);
    }
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setEditPlan({
      name: plan.name,
      description: plan.description || "",
      baseSalaryPerStudent: plan.baseSalaryPerStudent.toString(),
      currency: plan.currency,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      features: plan.planFeatures.map(pf => ({
        id: pf.feature.id,
        price: pf.price.toString(),
        isEnabled: pf.isEnabled,
      })),
    });
    setShowEditPlan(true);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !editPlan.name || !editPlan.baseSalaryPerStudent) {
      alert("Please fill in all required fields");
      return;
    }

    setUpdatingPlan(true);
    try {
      const response = await fetch(`/api/super-admin/pricing/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editPlan.name,
          description: editPlan.description,
          baseSalaryPerStudent: editPlan.baseSalaryPerStudent,
          currency: editPlan.currency,
          isActive: editPlan.isActive,
          isDefault: editPlan.isDefault,
          features: editPlan.features.map(f => ({
            id: f.id,
            price: parseFloat(f.price),
            isEnabled: f.isEnabled,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowEditPlan(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        alert(data.error || "Failed to update plan");
      }
    } catch (error) {
      console.error("Failed to update plan:", error);
      alert("Failed to update plan");
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: PricingPlan) => {
    if (plan._count.subscriptions > 0) {
      alert(`Cannot delete plan "${plan.name}" because it has ${plan._count.subscriptions} active subscriptions. Deactivate it instead.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/pricing/plans/${plan.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchPlans();
      } else {
        alert(data.error || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Failed to delete plan:", error);
      alert("Failed to delete plan");
    }
  };

  const handleTogglePlanStatus = async (plan: PricingPlan) => {
    try {
      const response = await fetch(`/api/super-admin/pricing/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !plan.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPlans();
      } else {
        alert(data.error || "Failed to update plan status");
      }
    } catch (error) {
      console.error("Failed to update plan status:", error);
      alert("Failed to update plan status");
    }
  };

  const addFeatureToPlan = (planState: any, setPlanState: any) => {
    setPlanState((prev: any) => ({
      ...prev,
      features: [...prev.features, { id: "", price: "0", isEnabled: true }],
    }));
  };

  const updateFeatureInPlan = (index: number, field: string, value: any, planState: any, setPlanState: any) => {
    setPlanState((prev: any) => ({
      ...prev,
      features: prev.features.map((f: any, i: number) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  const removeFeatureFromPlan = (index: number, planState: any, setPlanState: any) => {
    setPlanState((prev: any) => ({
      ...prev,
      features: prev.features.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleNameChange = (name: string) => {
    setNewPlan(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Pricing Plans</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Features</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Pricing Plans</h3>
              <p className="text-sm text-gray-600">
                Manage pricing plans for schools
              </p>
            </div>
            <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Plan</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Pricing Plan</DialogTitle>
                  <DialogDescription>
                    Create a new pricing plan for schools
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name">Plan Name *</Label>
                      <Input
                        id="plan-name"
                        value={newPlan.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Basic Plan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-slug">Slug *</Label>
                      <Input
                        id="plan-slug"
                        value={newPlan.slug}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="basic-plan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description</Label>
                    <Textarea
                      id="plan-description"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this pricing plan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base-salary">Base Salary per Student *</Label>
                      <Input
                        id="base-salary"
                        type="number"
                        step="0.01"
                        value={newPlan.baseSalaryPerStudent}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, baseSalaryPerStudent: e.target.value }))}
                        placeholder="50.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={newPlan.currency}
                        onValueChange={(value) => setNewPlan(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Features</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFeatureToPlan}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>

                    {newPlan.features.map((planFeature, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Select
                            value={planFeature.id}
                            onValueChange={(value) => updateFeatureInPlan(index, 'id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select feature" />
                            </SelectTrigger>
                            <SelectContent>
                              {features.map((feature) => (
                                <SelectItem key={feature.id} value={feature.id}>
                                  {feature.name} ({feature.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={planFeature.price}
                            onChange={(e) => updateFeatureInPlan(index, 'price', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={planFeature.isEnabled}
                            onCheckedChange={(checked) => updateFeatureInPlan(index, 'isEnabled', checked)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeatureFromPlan(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreatePlan(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePlan}
                      disabled={creatingPlan}
                    >
                      {creatingPlan ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="relative hover:shadow-lg transition-all duration-300">
                  {plan.isDefault && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.name}</span>
                      <div className="flex items-center space-x-1">
                        {plan.isActive ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-semibold">
                        {plan.currency} {plan.baseSalaryPerStudent} / student
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Schools:</span>
                      <Badge variant="secondary">
                        {plan._count.subscriptions}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Features:</Label>
                      <div className="flex flex-wrap gap-1">
                        {plan.planFeatures.map((pf) => (
                          <Badge
                            key={pf.id}
                            variant={pf.isEnabled ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {pf.feature.name}
                            {pf.price > 0 && ` (+${plan.currency}${pf.price})`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={plan.isActive ? "destructive" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTogglePlanStatus(plan)}
                      >
                        {plan.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Features</h3>
              <p className="text-sm text-gray-600">
                Manage available features for pricing plans
              </p>
            </div>
            <Dialog open={showCreateFeature} onOpenChange={setShowCreateFeature}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Feature</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Feature</DialogTitle>
                  <DialogDescription>
                    Create a new feature for pricing plans
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="feature-name">Feature Name *</Label>
                    <Input
                      id="feature-name"
                      value={newFeature.name}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Teacher Payment"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feature-code">Code *</Label>
                    <Input
                      id="feature-code"
                      value={newFeature.code}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="teacher_payment"
                    />
                    <p className="text-xs text-gray-500">
                      Unique identifier, use snake_case
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feature-description">Description</Label>
                    <Textarea
                      id="feature-description"
                      value={newFeature.description}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this feature"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-core"
                      checked={newFeature.isCore}
                      onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, isCore: checked }))}
                    />
                    <Label htmlFor="is-core">Core Feature</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateFeature(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFeature}
                      disabled={creatingFeature}
                    >
                      {creatingFeature ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Feature
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{feature.name}</span>
                      <div className="flex items-center space-x-1">
                        {feature.isActive ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                        {feature.isCore && (
                          <Badge variant="outline" className="text-xs">
                            Core
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Code:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {feature.code}
                      </code>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
