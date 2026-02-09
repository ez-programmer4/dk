"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Plus,
  Settings,
  DollarSign,
  Users,
  Star,
  Check,
  Edit,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface PremiumFeaturesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingTier {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyFee: number;
  maxStudents?: number;
  currency: string;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  trialDays: number;
  _count: {
    schools: number;
  };
}

interface Feature {
  code: string;
  name: string;
  description: string;
  category: string;
  business_value: string;
  development_cost: string;
}

const categoryColors = {
  management: "bg-blue-100 text-blue-800",
  analytics: "bg-green-100 text-green-800",
  security: "bg-purple-100 text-purple-800",
  configuration: "bg-gray-100 text-gray-800",
  dashboard: "bg-indigo-100 text-indigo-800",
  communication: "bg-yellow-100 text-yellow-800",
  finance: "bg-emerald-100 text-emerald-800",
  engagement: "bg-pink-100 text-pink-800",
  integration: "bg-cyan-100 text-cyan-800",
  branding: "bg-orange-100 text-orange-800",
};

const valueIcons = {
  high: Star,
  medium: Star,
  low: Star,
};

export default function PremiumFeaturesPanel({
  isOpen,
  onClose,
}: PremiumFeaturesPanelProps) {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    monthlyFee: "",
    maxStudents: "",
    currency: "ETB",
    features: [] as string[],
    trialDays: "14",
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch("/api/super-admin/premium-features", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPricingTiers(data.pricingTiers);
        setAvailableFeatures(data.availableFeatures);
      }
    } catch (error) {
      console.error("Failed to fetch premium features:", error);
      setError("Failed to load premium features");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) throw new Error("No authentication token");

      const action = editingTier ? "update_pricing_tier" : "create_pricing_tier";
      const pricingTierData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        monthlyFee: formData.monthlyFee,
        maxStudents: formData.maxStudents,
        currency: formData.currency,
        features: formData.features,
        trialDays: formData.trialDays,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
      };

      const response = await fetch("/api/super-admin/premium-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          pricingTierId: editingTier?.id,
          pricingTierData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pricing tier");
      }

      await fetchData();
      resetForm();
      setShowCreateForm(false);
      setEditingTier(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this pricing tier? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch("/api/super-admin/premium-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "delete_pricing_tier",
          pricingTierId: tierId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete pricing tier");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pricing tier");
    }
  };

  const toggleFeature = async (tierId: string, featureCode: string) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch("/api/super-admin/premium-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "toggle_feature",
          pricingTierId: tierId,
          featureCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle feature");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle feature");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      monthlyFee: "",
      maxStudents: "",
      currency: "ETB",
      features: [],
      trialDays: "14",
      isActive: true,
      isDefault: false,
    });
  };

  const startEditing = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      slug: tier.slug,
      description: tier.description || "",
      monthlyFee: tier.monthlyFee.toString(),
      maxStudents: tier.maxStudents?.toString() || "",
      currency: tier.currency,
      features: tier.features,
      trialDays: tier.trialDays.toString(),
      isActive: tier.isActive,
      isDefault: tier.isDefault,
    });
    setShowCreateForm(true);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-6xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Premium Features Management</h2>
                  <p className="text-sm text-gray-600">Configure pricing tiers and premium features</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Pricing Tiers</h3>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingTier(null);
                    setShowCreateForm(!showCreateForm);
                  }}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showCreateForm ? "Cancel" : "Create Tier"}
                </Button>
              </div>

              {/* Create/Edit Form */}
              <AnimatePresence>
                {showCreateForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {editingTier ? "Edit Pricing Tier" : "Create New Pricing Tier"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="name">Tier Name *</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Pro Plan"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="slug">Slug *</Label>
                              <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="e.g., pro-plan"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe what this tier includes"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <Label htmlFor="monthlyFee">Monthly Fee *</Label>
                              <Input
                                id="monthlyFee"
                                type="number"
                                value={formData.monthlyFee}
                                onChange={(e) => setFormData(prev => ({ ...prev, monthlyFee: e.target.value }))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="maxStudents">Max Students</Label>
                              <Input
                                id="maxStudents"
                                type="number"
                                value={formData.maxStudents}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
                                placeholder="Unlimited if empty"
                                min="1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="trialDays">Trial Days</Label>
                              <Input
                                id="trialDays"
                                type="number"
                                value={formData.trialDays}
                                onChange={(e) => setFormData(prev => ({ ...prev, trialDays: e.target.value }))}
                                placeholder="14"
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                              />
                              <Label htmlFor="isActive">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="isDefault"
                                checked={formData.isDefault}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                              />
                              <Label htmlFor="isDefault">Default Tier</Label>
                            </div>
                          </div>

                          {/* Features Selection */}
                          <div>
                            <Label className="text-base font-medium mb-3 block">Included Features</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                              {availableFeatures.map((feature) => (
                                <div
                                  key={feature.code}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    formData.features.includes(feature.code)
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      features: prev.features.includes(feature.code)
                                        ? prev.features.filter(f => f !== feature.code)
                                        : [...prev.features, feature.code]
                                    }));
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">{feature.name}</span>
                                        <Badge className={categoryColors[feature.category as keyof typeof categoryColors] || "bg-gray-100"}>
                                          {feature.category}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                                    </div>
                                    {formData.features.includes(feature.code) && (
                                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCreateForm(false);
                                setEditingTier(null);
                                resetForm();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  {editingTier ? "Update" : "Create"} Tier
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pricing Tiers List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pricingTiers.map((tier) => (
                    <Card key={tier.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>{tier.name}</span>
                              {tier.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              {!tier.isActive && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(tier)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTier(tier.id)}
                              disabled={tier._count.schools > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Pricing */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-lg">
                              {formatCurrency(tier.monthlyFee, tier.currency)}
                            </span>
                            <span className="text-sm text-gray-600">/month</span>
                          </div>
                          {tier.maxStudents && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">
                                Max {tier.maxStudents} students
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Trial */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Trial:</span>
                          <Badge variant="outline">{tier.trialDays} days</Badge>
                        </div>

                        {/* Schools using this tier */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Schools:</span>
                          <Badge variant="secondary">{tier._count.schools}</Badge>
                        </div>

                        <Separator />

                        {/* Features */}
                        <div>
                          <h4 className="font-medium mb-2">Included Features</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {tier.features.length === 0 ? (
                              <p className="text-sm text-gray-500">No premium features included</p>
                            ) : (
                              tier.features.map((featureCode) => {
                                const feature = availableFeatures.find(f => f.code === featureCode);
                                return feature ? (
                                  <div key={featureCode} className="flex items-center justify-between">
                                    <span className="text-sm">{feature.name}</span>
                                    <Badge className={categoryColors[feature.category as keyof typeof categoryColors] || "bg-gray-100"}>
                                      {feature.category}
                                    </Badge>
                                  </div>
                                ) : null;
                              })
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}








