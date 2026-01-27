"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Receipt,
  Target,
  X,
  Settings,
  Edit,
  Save,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

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
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);
  const [togglingPremium, setTogglingPremium] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [editFeatureData, setEditFeatureData] = useState({
    name: "",
    description: "",
    code: "",
    isCore: false,
    isActive: true,
  });
  const [updatingFeature, setUpdatingFeature] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
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
    fetchPremiumFeatures();
    fetchAllFeatures();
  }, []);

  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const fetchAllFeatures = async () => {
    setLoadingFeatures(true);
    try {
      const response = await fetch("/api/super-admin/pricing/features");
      const data = await response.json();
      if (data.success) {
        setAllFeatures(data.features);
      }
    } catch (error) {
      console.error("Failed to fetch all features:", error);
    } finally {
      setLoadingFeatures(false);
    }
  };

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

  const fetchPremiumFeatures = async () => {
    try {
      const response = await fetch("/api/super-admin/features/premium");
      const data = await response.json();
      if (data.success) {
        setPremiumFeatures(data.premiumFeatures.map((pf: any) => pf.featureCode));
      }
    } catch (error) {
      console.error("Failed to fetch premium features:", error);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeature),
      });

      const data = await response.json();
      if (data.success) {
        setActivePanel(null);
        setNewFeature({
          name: "",
          description: "",
          code: "",
          isCore: false,
        });
        fetchFeatures();
        fetchAllFeatures();
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

  const handleTogglePremium = async (featureCode: string, isPremium: boolean) => {
    setTogglingPremium(featureCode);
    setError(null);

    try {
      if (isPremium) {
        const response = await fetch("/api/super-admin/features/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            featureCode,
            requiredPlans: ["professional", "enterprise"],
            isEnabled: true
          }),
        });
        const data = await response.json();

        if (data.success) {
          setPremiumFeatures(prev => [...prev, featureCode]);
          setError(null);
        } else {
          setError(data.error || "Failed to make feature premium");
        }
      } else {
        const response = await fetch(`/api/super-admin/features/premium/${featureCode}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          setPremiumFeatures(prev => prev.filter(code => code !== featureCode));
          setError(null);
        } else {
          setError(data.error || "Failed to make feature core");
        }
      }
    } catch (err) {
      console.error("Failed to toggle premium status:", err);
      setError("An unexpected error occurred");
    } finally {
      setTogglingPremium(null);
    }
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setEditFeatureData({
      name: feature.name,
      description: feature.description || "",
      code: feature.code,
      isCore: feature.isCore,
      isActive: feature.isActive,
    });
    setActivePanel('edit-feature');
  };

  const handleUpdateFeature = async () => {
    if (!editingFeature || !editFeatureData.name || !editFeatureData.code) {
      alert("Please fill in all required fields");
      return;
    }

    setUpdatingFeature(true);
    try {
      const response = await fetch(`/api/super-admin/pricing/features/${editingFeature.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFeatureData),
      });

      const data = await response.json();
      if (data.success) {
        setActivePanel(null);
        setEditingFeature(null);
        fetchFeatures();
        fetchAllFeatures();
        fetchPremiumFeatures();
      } else {
        alert(data.error || "Failed to update feature");
      }
    } catch (error) {
      console.error("Failed to update feature:", error);
      alert("Failed to update feature");
    } finally {
      setUpdatingFeature(false);
    }
  };

  const handleDeleteFeature = async (feature: Feature) => {
    if (!confirm(`Are you sure you want to delete the feature "${feature.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/pricing/features/${feature.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchFeatures();
        fetchAllFeatures();
        fetchPremiumFeatures();
      } else {
        alert(data.error || "Failed to delete feature");
      }
    } catch (error) {
      console.error("Failed to delete feature:", error);
      alert("Failed to delete feature");
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Plans</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Features</span>
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Premium</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Pricing Plans</h3>
              <p className="text-sm text-gray-600">Manage pricing plans for schools</p>
            </div>
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

                    <div className="flex justify-center">
                      <span className={`text-xs px-2 py-1 rounded ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
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
              <h3 className="text-lg font-medium">Feature Management</h3>
              <p className="text-sm text-gray-600">Create, edit, and delete features for your platform</p>
            </div>
            <Button
              className="flex items-center space-x-2"
              onClick={() => setActivePanel('create-feature')}
            >
              <Plus className="w-4 h-4" />
              <span>Create Feature</span>
            </Button>
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
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Code:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {feature.code}
                      </code>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditFeature(feature)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteFeature(feature)}
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

        <TabsContent value="premium" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Premium Feature Settings</h3>
              <p className="text-sm text-gray-600">Toggle features between core (free) and premium (paid) access</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAllFeatures();
                fetchPremiumFeatures();
              }}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Card className="p-6">
            {loadingFeatures ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading features...</span>
              </div>
            ) : allFeatures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No features available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{feature.name}</h4>
                        <div className="flex items-center space-x-2">
                          {feature.isCore && (
                            <Badge variant="outline" className="text-xs">
                              Core
                            </Badge>
                          )}
                          {togglingPremium === feature.code && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Code:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {feature.code}
                        </code>
                        {premiumFeatures.includes(feature.code) && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-800">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={premiumFeatures.includes(feature.code)}
                        onCheckedChange={(checked) => handleTogglePremium(feature.code, checked)}
                        disabled={togglingPremium === feature.code}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {activePanel === 'create-feature' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setActivePanel(null)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900">Create Feature</h2>
                <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-6 py-6">
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
                    <p className="text-xs text-gray-500">Unique identifier, use snake_case</p>
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

                  <div className="flex justify-end space-x-2 pt-6 border-t">
                    <Button variant="outline" onClick={() => setActivePanel(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFeature} disabled={creatingFeature}>
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
              </div>
            </motion.div>
          </>
        )}

        {activePanel === 'edit-feature' && editingFeature && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setActivePanel(null)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900">Edit Feature</h2>
                <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-feature-name">Feature Name *</Label>
                    <Input
                      id="edit-feature-name"
                      value={editFeatureData.name}
                      onChange={(e) => setEditFeatureData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Teacher Payment"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-feature-code">Code *</Label>
                    <Input
                      id="edit-feature-code"
                      value={editFeatureData.code}
                      onChange={(e) => setEditFeatureData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="teacher_payment"
                    />
                    <p className="text-xs text-gray-500">Unique identifier, use snake_case</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-feature-description">Description</Label>
                    <Textarea
                      id="edit-feature-description"
                      value={editFeatureData.description}
                      onChange={(e) => setEditFeatureData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this feature"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is-core"
                      checked={editFeatureData.isCore}
                      onCheckedChange={(checked) => setEditFeatureData(prev => ({ ...prev, isCore: checked }))}
                    />
                    <Label htmlFor="edit-is-core">Core Feature</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is-active"
                      checked={editFeatureData.isActive}
                      onCheckedChange={(checked) => setEditFeatureData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="edit-is-active">Active Feature</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-6 border-t">
                    <Button variant="outline" onClick={() => setActivePanel(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateFeature} disabled={updatingFeature}>
                      {updatingFeature ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Feature
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}