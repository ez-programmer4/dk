"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Crown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface DynamicFeature {
  id?: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  basePricePerStudent: number;
  currency: string;
  isActive: boolean;
  isRequired: boolean;
  sortOrder: number;
}

interface DynamicFeaturePanelProps {
  feature?: DynamicFeature | null;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'management',
  'analytics',
  'finance',
  'engagement',
  'communication',
  'security',
  'integration',
  'branding',
  'reporting',
  'automation'
];

const currencies = ['ETB', 'USD', 'EUR', 'GBP'];

export default function DynamicFeaturePanel({
  feature,
  onClose,
  onSuccess
}: DynamicFeaturePanelProps) {
  const [formData, setFormData] = useState<DynamicFeature>({
    code: '',
    name: '',
    description: '',
    category: 'management',
    basePricePerStudent: 0,
    currency: 'ETB',
    isActive: true,
    isRequired: false,
    sortOrder: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (feature) {
      setFormData({
        id: feature.id,
        code: feature.code,
        name: feature.name,
        description: feature.description || '',
        category: feature.category,
        basePricePerStudent: feature.basePricePerStudent,
        currency: feature.currency,
        isActive: feature.isActive,
        isRequired: feature.isRequired,
        sortOrder: feature.sortOrder,
      });
    }
  }, [feature]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Feature code is required';
    } else if (!/^[a-z_][a-z0-9_]*$/.test(formData.code)) {
      newErrors.code = 'Code must be lowercase with underscores only';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Feature name is required';
    }

    if (formData.basePricePerStudent < 0) {
      newErrors.basePricePerStudent = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = feature?.id
        ? `/api/super-admin/dynamic-features/${feature.id}`
        : '/api/super-admin/dynamic-features';

      const method = feature?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          basePricePerStudent: formData.basePricePerStudent,
          currency: formData.currency,
          isActive: formData.isActive,
          isRequired: formData.isRequired,
          sortOrder: formData.sortOrder,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save feature');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: data.message,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DynamicFeature, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">
                    {feature ? 'Edit Feature' : 'Create Dynamic Feature'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {feature ? 'Update feature configuration' : 'Add a new premium feature'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Feature Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="e.g., advanced_reports"
                      className={errors.code ? 'border-red-500' : ''}
                      disabled={!!feature} // Can't change code when editing
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Unique identifier (lowercase, underscores only)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="name">Feature Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Advanced Reports"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this feature does..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Pricing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="basePricePerStudent">Price per Student *</Label>
                    <Input
                      id="basePricePerStudent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.basePricePerStudent}
                      onChange={(e) => handleInputChange('basePricePerStudent', parseFloat(e.target.value) || 0)}
                      className={errors.basePricePerStudent ? 'border-red-500' : ''}
                    />
                    {errors.basePricePerStudent && (
                      <p className="text-red-500 text-sm mt-1">{errors.basePricePerStudent}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive" className="text-base">Active Feature</Label>
                    <p className="text-sm text-gray-600">Enable this feature for schools</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isRequired" className="text-base">Required Feature</Label>
                    <p className="text-sm text-gray-600">Cannot be disabled once enabled</p>
                  </div>
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => handleInputChange('isRequired', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Lower numbers appear first in lists
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {feature ? 'Update Feature' : 'Create Feature'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

