"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import {
  Crown,
  Plus,
  Settings,
  DollarSign,
  Users,
  Building2,
  Edit,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  BarChart3,
  Shield,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Power,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import DynamicFeaturePanel from "@/components/super-admin/DynamicFeaturePanel";

interface DynamicFeature {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  basePricePerStudent: number;
  currency: string;
  isActive: boolean;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface School {
  id: string;
  slug: string;
  name: string;
  status: string;
  activeStudents: number;
  premiumFeatures: {
    id: string;
    feature: DynamicFeature;
    isEnabled: boolean;
    customPricePerStudent?: number;
  }[];
}

export default function UnifiedPremiumFeaturesPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("features");
  const [authError, setAuthError] = useState(false);

  // Features Management State
  const [features, setFeatures] = useState<DynamicFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresSearch, setFeaturesSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingFeature, setEditingFeature] = useState<DynamicFeature | null>(null);
  const [deleteFeature, setDeleteFeature] = useState<DynamicFeature | null>(null);

  // Schools Management State
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsSearch, setSchoolsSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/super-admin/login');
    }
    if (status === 'authenticated') {
      fetchFeatures();
      fetchSchools();
    }
  }, [status]);

  const fetchFeatures = async () => {
    try {
      setFeaturesLoading(true);
      const response = await fetch('/api/super-admin/dynamic-features');
      if (response.status === 401) {
        setAuthError(true);
        toast({
          title: 'Authentication Required',
          description: 'Please log in as a super admin to access this page',
          variant: 'destructive',
        });
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: 'Error',
        description: 'Failed to load features',
        variant: 'destructive',
      });
    } finally {
      setFeaturesLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      setSchoolsLoading(true);
      // For now, fetch schools and their premium features separately
      // TODO: Update schools API to include premium features
      const [schoolsResponse, featuresResponse] = await Promise.all([
        fetch('/api/super-admin/schools'),
        fetch('/api/super-admin/dynamic-features?activeOnly=true')
      ]);

      if (schoolsResponse.status === 401 || featuresResponse.status === 401) {
        setAuthError(true);
        toast({
          title: 'Authentication Required',
          description: 'Please log in as a super admin to access this page',
          variant: 'destructive',
        });
        return;
      }

      if (!schoolsResponse.ok || !featuresResponse.ok) throw new Error('Failed to fetch data');

      const schoolsData = await schoolsResponse.json();
      const featuresData = await featuresResponse.json();

      // Mock premium features data for now - in production this would come from the API
      const schoolsWithFeatures = schoolsData.schools.map((school: any) => ({
        ...school,
        premiumFeatures: featuresData.features.map((feature: any) => ({
          id: `${school.id}_${feature.id}`,
          feature,
          isEnabled: Math.random() > 0.7, // Mock data - replace with real data
          customPricePerStudent: undefined
        }))
      }));

      setSchools(schoolsWithFeatures || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schools',
        variant: 'destructive',
      });
    } finally {
      setSchoolsLoading(false);
    }
  };

  const toggleFeatureForSchool = async (schoolId: string, featureId: string, currentlyEnabled: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/premium-features/school/${schoolId}/feature/${featureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle feature');
      }

      toast({
        title: 'Success',
        description: `Feature ${!currentlyEnabled ? 'enabled' : 'disabled'} successfully`,
      });

      fetchSchools(); // Refresh schools data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeature = async () => {
    if (!deleteFeature) return;

    try {
      const response = await fetch(`/api/super-admin/dynamic-features/${deleteFeature.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete feature');
      }

      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });

      setDeleteFeature(null);
      fetchFeatures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(featuresSearch.toLowerCase()) ||
                         feature.code.toLowerCase().includes(featuresSearch.toLowerCase()) ||
                         feature.description?.toLowerCase().includes(featuresSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(schoolsSearch.toLowerCase()) ||
                         school.slug.toLowerCase().includes(schoolsSearch.toLowerCase());
    return matchesSearch;
  });

  const categories = Array.from(new Set(features.map(f => f.category)));

  // Calculate statistics
  const totalFeatures = features.length;
  const activeFeatures = features.filter(f => f.isActive).length;
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'active').length;
  const totalRevenue = schools.reduce((sum, school) => {
    return sum + school.premiumFeatures
      .filter(pf => pf.isEnabled)
      .reduce((schoolSum, pf) => {
        const price = pf.customPricePerStudent || pf.feature.basePricePerStudent;
        return schoolSum + (price * school.activeStudents);
      }, 0);
  }, 0);

  if (status === 'loading' || featuresLoading || schoolsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (authError || (status === 'authenticated' && (session?.user as any)?.role !== 'superAdmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-4">
              You need super admin privileges to access this page.
            </p>
            <p className="text-sm text-red-600">
              Please log in with super admin credentials or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Premium Features Management</h1>
                <p className="text-gray-600">Manage premium features and school access</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeatures}</div>
              <p className="text-xs text-muted-foreground">{activeFeatures} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSchools}</div>
              <p className="text-xs text-muted-foreground">{activeSchools} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} ETB</div>
              <p className="text-xs text-muted-foreground">per month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">feature types</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Feature Management
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              School Access
            </TabsTrigger>
          </TabsList>

          {/* Features Management Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Premium Features</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create and manage premium features available to schools
                    </p>
                  </div>
                  <Button onClick={() => setShowCreatePanel(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search features..."
                        value={featuresSearch}
                        onChange={(e) => setFeaturesSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFeatures.map((feature) => (
                    <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={feature.isActive ? "default" : "secondary"}>
                            {feature.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setEditingFeature(feature)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteFeature(feature)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <p className="text-sm text-gray-600 font-mono">{feature.code}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{feature.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Category:</span>
                            <Badge variant="outline">{feature.category}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Price:</span>
                            <span className="font-semibold">{feature.basePricePerStudent} {feature.currency}/student</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Required:</span>
                            {feature.isRequired ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredFeatures.length === 0 && (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
                    <p className="text-gray-500">Create your first premium feature to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Access Tab */}
          <TabsContent value="schools" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>School Access Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Control which schools have access to premium features
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* School Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search schools..."
                      value={schoolsSearch}
                      onChange={(e) => setSchoolsSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Schools List */}
                <div className="space-y-4">
                  {filteredSchools.map((school) => (
                    <Card key={school.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <CardTitle className="text-lg">{school.name}</CardTitle>
                              <p className="text-sm text-gray-600">{school.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={school.status === 'active' ? "default" : "secondary"}>
                              {school.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {school.activeStudents} students
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Premium Features Access:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {features.filter(f => f.isActive).map((feature) => {
                              const schoolFeature = school.premiumFeatures.find(pf => pf.feature.id === feature.id);
                              const isEnabled = schoolFeature?.isEnabled || false;

                              return (
                                <div key={feature.id} className="flex items-center justify-between p-2 border rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{feature.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {school.activeStudents > 0 && isEnabled ?
                                        `${(schoolFeature?.customPricePerStudent || feature.basePricePerStudent) * school.activeStudents} ETB/mo` :
                                        `${feature.basePricePerStudent} ETB/student`
                                      }
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFeatureForSchool(school.id, feature.id, isEnabled)}
                                    className={`ml-2 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}
                                  >
                                    {isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredSchools.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
                    <p className="text-gray-500">No schools match your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Feature Panel */}
      {(showCreatePanel || editingFeature) && (
        <DynamicFeaturePanel
          feature={editingFeature}
          onClose={() => {
            setShowCreatePanel(false);
            setEditingFeature(null);
          }}
          onSuccess={() => {
            setShowCreatePanel(false);
            setEditingFeature(null);
            fetchFeatures();
          }}
        />
      )}

      {/* Delete Feature Confirmation */}
      <AlertDialog open={!!deleteFeature} onOpenChange={() => setDeleteFeature(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFeature?.name}"? This action cannot be undone.
              {deleteFeature?.isRequired && (
                <span className="block mt-2 text-red-600 font-semibold">
                  ⚠️ This is a required feature and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteFeature?.isRequired}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}