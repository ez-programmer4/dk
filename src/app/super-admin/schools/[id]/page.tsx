"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowLeft,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Shield,
  Globe,
  Palette,
  Activity,
  UserCheck,
  TrendingUp,
  Eye,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
  Archive,
  Plus,
  Search,
  Filter,
  UserPlus,
  UserX,
  UserCog,
  GraduationCap,
  BookOpen,
  Crown,
  FileText,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SchoolEditPanel } from "./components/SchoolEditPanel";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: string;
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  features?: any;
  telegramBotToken?: string;
  createdAt: string;
  _count: {
    admins: number;
    teachers: number;
    students: number;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  growthRate: number;
  lastUpdated: string;
}

export default function SchoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");


  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails();
      fetchAnalyticsData();
      fetchUsers();
      fetchAuditLogs();
    }
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`);
      const data = await response.json();

      if (data.success) {
        setSchool(data.school);
      }
    } catch (error) {
      console.error("Failed to fetch school details:", error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      // Mock analytics data for now - replace with real API call later
      setAnalytics({
        totalStudents: school?._count.students || 0,
        activeStudents: Math.floor((school?._count.students || 0) * 0.85),
        totalTeachers: school?._count.teachers || 0,
        totalAdmins: school?._count.admins || 0,
        growthRate: 12.5,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/users`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleAddUser = async (userData: any) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsAddUserModalOpen(false);
        fetchUsers();
        fetchSchoolDetails(); // Update counts
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      alert("Failed to add user");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditUser = async (userId: string, userData: any) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsEditUserModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, role: string) => {
    if (!confirm(`Are you sure you want to delete this ${role}?`)) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/users/${userId}?role=${role}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
        fetchSchoolDetails(); // Update counts
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    } finally {
      setUpdating(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/audit-logs`);
      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesSearch = !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
    const matchesSearch = !auditSearchQuery ||
      log.details?.schoolName?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(auditSearchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });


  const handleStatusChange = async () => {
    if (!pendingStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: pendingStatus,
          reason: statusReason,
        }),
      });

      if (response.ok) {
        setIsStatusModalOpen(false);
        setPendingStatus("");
        setStatusReason("");
        fetchSchoolDetails();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update school status");
      }
    } catch (error) {
      console.error("Failed to update school status:", error);
      alert("Failed to update school status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSchool = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/super-admin/schools");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete school");
      }
    } catch (error) {
      console.error("Failed to delete school:", error);
      alert("Failed to delete school");
    } finally {
      setUpdating(false);
      setIsDeleteModalOpen(false);
    }
  };

  const openStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const handleConfigUpdate = async (field: string, value: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (response.ok) {
        fetchSchoolDetails(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update configuration");
      }
    } catch (error) {
      console.error("Failed to update configuration:", error);
      alert("Failed to update configuration");
    } finally {
      setUpdating(false);
    }
  };

  const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
    setUpdating(true);
    try {
      const currentFeatures = school.features || {};
      const updatedFeatures = {
        ...currentFeatures,
        [featureKey]: enabled,
      };

      const response = await fetch(`/api/super-admin/schools/${schoolId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: updatedFeatures,
        }),
      });

      if (response.ok) {
        fetchSchoolDetails(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update feature");
      }
    } catch (error) {
      console.error("Failed to update feature:", error);
      alert("Failed to update feature");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Suspended</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">School Not Found</h2>
          <p className="text-slate-600 mb-6">The requested school could not be found or has been removed.</p>
          <Button
            onClick={() => router.back()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Schools
              </Button>

              <div className="flex items-center space-x-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: school.primaryColor || '#3B82F6' }}
                >
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={school.name} className="w-8 h-8 rounded-lg" />
                  ) : (
                    getInitials(school.name)
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{school.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    {getStatusBadge(school.status)}
                    <span className="text-sm text-slate-500">•</span>
                    <span className="text-sm text-slate-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Created {new Date(school.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditPanelOpen(true)}
                className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all duration-200">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 shadow-lg">
                  <DropdownMenuLabel className="text-slate-900 font-semibold">School Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => openStatusChange("active")}
                    className="text-green-700 hover:bg-green-50 cursor-pointer"
                    disabled={school?.status === "active"}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Activate School
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openStatusChange("inactive")}
                    className="text-amber-700 hover:bg-amber-50 cursor-pointer"
                    disabled={school?.status === "inactive"}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Deactivate School
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openStatusChange("suspended")}
                    className="text-red-700 hover:bg-red-50 cursor-pointer"
                    disabled={school?.status === "suspended"}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend School
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete School
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100/80 p-1 rounded-2xl backdrop-blur-sm">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <FileText className="w-4 h-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-900">Status</CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(school.status)}
                  <p className="text-xs text-emerald-700 mt-2 font-medium">
                    Operational
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900">Students</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{school._count.students}</div>
                  <p className="text-xs text-blue-700 mt-1">
                    Active learners
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-purple-900">Teachers</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">{school._count.teachers}</div>
                  <p className="text-xs text-purple-700 mt-1">
                    Educational staff
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-amber-900">Admins</CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Settings className="h-4 w-4 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-900">{school._count.admins}</div>
                  <p className="text-xs text-amber-700 mt-1">
                    Administrators
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* School Information Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <Mail className="w-5 h-5 mr-2 text-slate-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Email</p>
                      <p className="text-sm text-slate-600">{school.email}</p>
                    </div>
                  </div>
                  {school.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Phone</p>
                        <p className="text-sm text-slate-600">{school.phone}</p>
                      </div>
                    </div>
                  )}
                  {school.address && (
                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Address</p>
                        <p className="text-sm text-slate-600">{school.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <Globe className="w-5 h-5 mr-2 text-slate-600" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Timezone</p>
                      <p className="text-sm font-medium text-slate-900">{school.timezone}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Currency</p>
                      <p className="text-sm font-medium text-slate-900">{school.defaultCurrency}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Language</p>
                      <p className="text-sm font-medium text-slate-900">{school.defaultLanguage}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">School ID</p>
                      <p className="text-xs font-mono text-slate-700 truncate">{school.id}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">School Slug</p>
                    <p className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded border">
                      {school.slug}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Branding Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <Palette className="w-5 h-5 mr-2 text-slate-600" />
                    Branding & Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border-2 border-white"
                        style={{ backgroundColor: school.primaryColor || '#3B82F6' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Primary Color</p>
                        <p className="text-xs text-slate-500">{school.primaryColor || '#3B82F6'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border-2 border-white"
                        style={{ backgroundColor: school.secondaryColor || '#1F2937' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Secondary Color</p>
                        <p className="text-xs text-slate-500">{school.secondaryColor || '#1F2937'}</p>
                      </div>
                    </div>
                    {school.logoUrl && (
                      <div className="flex items-center space-x-3">
                        <img src={school.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Logo</p>
                          <p className="text-xs text-slate-500">Configured</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-slate-900">
                      <FileText className="w-5 h-5 mr-2 text-slate-600" />
                      Audit Logs
                    </CardTitle>
                    <Button
                      onClick={fetchAuditLogs}
                      variant="outline"
                      className="rounded-lg border-slate-200 hover:bg-slate-50"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {/* Audit Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search logs by action, resource, or details..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="pl-10 rounded-lg border-slate-200 focus:border-slate-400"
                      />
                    </div>
                    <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                      <SelectTrigger className="w-full sm:w-48 rounded-lg border-slate-200 focus:border-slate-400">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create_school">Create School</SelectItem>
                        <SelectItem value="update_school">Update School</SelectItem>
                        <SelectItem value="update_school_status">Update Status</SelectItem>
                        <SelectItem value="update_school_config">Update Config</SelectItem>
                        <SelectItem value="create_user">Create User</SelectItem>
                        <SelectItem value="update_user">Update User</SelectItem>
                        <SelectItem value="delete_user">Delete User</SelectItem>
                        <SelectItem value="delete_school">Delete School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent>
                  {filteredAuditLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No audit logs found</h3>
                      <p className="text-slate-600 max-w-md mx-auto">
                        {auditSearchQuery || auditActionFilter !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "No audit logs have been recorded for this school yet."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAuditLogs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className={`p-2 rounded-lg ${
                              log.action?.includes('create') ? 'bg-green-100' :
                              log.action?.includes('update') ? 'bg-blue-100' :
                              log.action?.includes('delete') ? 'bg-red-100' :
                              'bg-slate-100'
                            }`}>
                              {log.action?.includes('create') && <UserPlus className="w-4 h-4 text-green-600" />}
                              {log.action?.includes('update') && <Edit className="w-4 h-4 text-blue-600" />}
                              {log.action?.includes('delete') && <UserX className="w-4 h-4 text-red-600" />}
                              {!log.action?.includes('create') && !log.action?.includes('update') && !log.action?.includes('delete') && (
                                <FileText className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-slate-900 capitalize">
                                {log.action?.replace(/_/g, ' ')}
                              </h4>
                              <Badge className={`text-xs ${
                                log.action?.includes('create') ? 'bg-green-100 text-green-800' :
                                log.action?.includes('update') ? 'bg-blue-100 text-blue-800' :
                                log.action?.includes('delete') ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {log.resourceType}
                              </Badge>
                            </div>

                            <p className="text-sm text-slate-600 mb-2">
                              {log.details?.schoolName && (
                                <span>School: <span className="font-medium">{log.details.schoolName}</span></span>
                              )}
                              {log.details?.role && (
                                <span> • Role: <span className="font-medium">{log.details.role}</span></span>
                              )}
                              {log.details?.userData?.name && (
                                <span> • User: <span className="font-medium">{log.details.userData.name}</span></span>
                              )}
                            </p>

                            {log.details?.changes && Object.keys(log.details.changes).length > 0 && (
                              <div className="text-xs text-slate-500 bg-white p-2 rounded border mb-2">
                                <div className="font-medium mb-1">Changes:</div>
                                {Object.entries(log.details.changes).map(([key, change]: [string, any]) => (
                                  change && (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                      <span>
                                        {change.from && <span className="line-through text-red-500 mr-1">{String(change.from)}</span>}
                                        {change.to && <span className="text-green-600">{String(change.to)}</span>}
                                        {change === true && <span className="text-green-600">Yes</span>}
                                      </span>
                                    </div>
                                  )
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                                {log.ipAddress && (
                                  <span className="flex items-center">
                                    <Globe className="w-3 h-3 mr-1" />
                                    {log.ipAddress}
                                  </span>
                                )}
                              </div>
                              {log.superAdmin && (
                                <div className="flex items-center space-x-1">
                                  <span>by</span>
                                  <span className="font-medium">{log.superAdmin.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {analytics && (
                <>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-900 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Growth Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">+{analytics.growthRate}%</div>
                      <p className="text-xs text-green-700 mt-1">Monthly growth</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-cyan-900 flex items-center">
                        <Activity className="w-4 h-4 mr-2" />
                        Active Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-900">{analytics.activeStudents}</div>
                      <p className="text-xs text-cyan-700 mt-1">Currently active</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-indigo-900 flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-900">87%</div>
                      <p className="text-xs text-indigo-700 mt-1">Average engagement</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>

            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900">
                  <BarChart3 className="w-5 h-5 mr-2 text-slate-600" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Comprehensive analytics, reporting, and insights will be available here to help you make data-driven decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-8">
            {/* User Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-6"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 text-center">
                <CardContent className="pt-6">
                  <GraduationCap className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-blue-900 mb-1">{school._count.students}</div>
                  <p className="text-blue-700 font-medium text-sm">Students</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 text-center">
                <CardContent className="pt-6">
                  <BookOpen className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-purple-900 mb-1">{school._count.teachers}</div>
                  <p className="text-purple-700 font-medium text-sm">Teachers</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 text-center">
                <CardContent className="pt-6">
                  <Crown className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-900 mb-1">{school._count.admins}</div>
                  <p className="text-amber-700 font-medium text-sm">Admins</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 text-center">
                <CardContent className="pt-6">
                  <UserCog className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-emerald-900 mb-1">2</div>
                  <p className="text-emerald-700 font-medium text-sm">Controllers</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50 text-center">
                <CardContent className="pt-6">
                  <FileText className="w-10 h-10 text-rose-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-rose-900 mb-1">1</div>
                  <p className="text-rose-700 font-medium text-sm">Registrals</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Management Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-slate-900">
                      <Users className="w-5 h-5 mr-2 text-slate-600" />
                      User Management
                    </CardTitle>
                    <Button
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>

                  {/* Filters and Search */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search users by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-lg border-slate-200 focus:border-slate-400"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full sm:w-48 rounded-lg border-slate-200 focus:border-slate-400">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Administrators</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="controller">Controllers</SelectItem>
                        <SelectItem value="registral">Registrals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                      <p className="text-slate-600 max-w-md mx-auto mb-6">
                        {searchQuery || selectedRole !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "No users have been added to this school yet."
                        }
                      </p>
                      <Button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First User
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">
                                {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-slate-900">{user.name || user.username}</h4>
                              <p className="text-sm text-slate-600">
                                {user.username && user.username !== user.name ? `@${user.username} • ` : ''}
                                {user.email || 'No email'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`text-xs ${
                                  user.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                  user.role === 'teacher' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                                  user.role === 'controller' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {user.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                                  {user.role === 'teacher' && <BookOpen className="w-3 h-3 mr-1" />}
                                  {user.role === 'student' && <GraduationCap className="w-3 h-3 mr-1" />}
                                  {user.role === 'controller' && <UserCog className="w-3 h-3 mr-1" />}
                                  {user.role === 'registral' && <FileText className="w-3 h-3 mr-1" />}
                                  {user.role}
                                </Badge>
                                {user.phone && (
                                  <span className="text-xs text-slate-500 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserModalOpen(true);
                              }}
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.role)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            {/* Configuration Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Settings className="w-5 h-5 mr-2 text-slate-600" />
                    Regional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Timezone</Label>
                      <Select value={school.timezone} onValueChange={(value) => handleConfigUpdate('timezone', value)}>
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                          <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                          <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Gulf Standard Time (GST)</SelectItem>
                          <SelectItem value="Asia/Riyadh">Arabia Standard Time (AST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Currency</Label>
                      <Select value={school.defaultCurrency} onValueChange={(value) => handleConfigUpdate('defaultCurrency', value)}>
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                          <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-700">Language</Label>
                      <Select value={school.defaultLanguage} onValueChange={(value) => handleConfigUpdate('defaultLanguage', value)}>
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                          <SelectItem value="fr">Français (French)</SelectItem>
                          <SelectItem value="es">Español (Spanish)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Palette className="w-5 h-5 mr-2 text-slate-600" />
                    Branding & Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: school.primaryColor || '#3B82F6' }}
                        />
                        <Input
                          type="color"
                          value={school.primaryColor || '#3B82F6'}
                          onChange={(e) => handleConfigUpdate('primaryColor', e.target.value)}
                          className="w-16 h-8 rounded border-slate-200"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: school.secondaryColor || '#1F2937' }}
                        />
                        <Input
                          type="color"
                          value={school.secondaryColor || '#1F2937'}
                          onChange={(e) => handleConfigUpdate('secondaryColor', e.target.value)}
                          className="w-16 h-8 rounded border-slate-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Logo URL</Label>
                      <Input
                        value={school.logoUrl || ''}
                        onChange={(e) => handleConfigUpdate('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Activity className="w-5 h-5 mr-2 text-slate-600" />
                    Feature Flags
                  </CardTitle>
                  <p className="text-sm text-slate-600">Enable or disable specific features for this school</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'zoom', label: 'Zoom Integration', description: 'Enable Zoom meeting links' },
                      { key: 'analytics', label: 'Analytics Dashboard', description: 'School performance metrics' },
                      { key: 'reports', label: 'Advanced Reports', description: 'Detailed reporting features' },
                      { key: 'attendance', label: 'Attendance Tracking', description: 'Automated attendance system' },
                      { key: 'payments', label: 'Payment Processing', description: 'Online payment features' },
                      { key: 'notifications', label: 'Push Notifications', description: 'Real-time notifications' },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`feature-${feature.key}`}
                          checked={school.features?.[feature.key] || false}
                          onChange={(e) => handleFeatureToggle(feature.key, e.target.checked)}
                          className="mt-1 w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                        />
                        <div>
                          <Label
                            htmlFor={`feature-${feature.key}`}
                            className="text-sm font-medium text-slate-900 cursor-pointer"
                          >
                            {feature.label}
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Globe className="w-5 h-5 mr-2 text-slate-600" />
                    Regional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Timezone</span>
                    <span className="text-sm text-slate-600">{school.timezone}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Currency</span>
                    <span className="text-sm text-slate-600">{school.defaultCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Language</span>
                    <span className="text-sm text-slate-600">{school.defaultLanguage}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Palette className="w-5 h-5 mr-2 text-slate-600" />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div
                      className="w-6 h-6 rounded-md border-2 border-white shadow-sm"
                      style={{ backgroundColor: school.primaryColor || '#3B82F6' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Primary Color</p>
                      <p className="text-xs text-slate-500">{school.primaryColor || '#3B82F6'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div
                      className="w-6 h-6 rounded-md border-2 border-white shadow-sm"
                      style={{ backgroundColor: school.secondaryColor || '#1F2937' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Secondary Color</p>
                      <p className="text-xs text-slate-500">{school.secondaryColor || '#1F2937'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {school.createdBy && (
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <Shield className="w-5 h-5 mr-2 text-slate-600" />
                    Created By
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                        {school.createdBy.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{school.createdBy.name}</p>
                      <p className="text-sm text-slate-600">{school.createdBy.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Created {new Date(school.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center">
              {pendingStatus === "active" && <Power className="w-5 h-5 mr-2 text-green-600" />}
              {pendingStatus === "inactive" && <Archive className="w-5 h-5 mr-2 text-amber-600" />}
              {pendingStatus === "suspended" && <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />}
              {pendingStatus === "active" && "Activate School"}
              {pendingStatus === "inactive" && "Deactivate School"}
              {pendingStatus === "suspended" && "Suspend School"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              pendingStatus === "active" ? "bg-green-50 border-green-200" :
              pendingStatus === "inactive" ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  pendingStatus === "active" ? "bg-green-100" :
                  pendingStatus === "inactive" ? "bg-amber-100" :
                  "bg-red-100"
                }`}>
                  {pendingStatus === "active" && <Power className="w-5 h-5 text-green-600" />}
                  {pendingStatus === "inactive" && <Archive className="w-5 h-5 text-amber-600" />}
                  {pendingStatus === "suspended" && <AlertTriangle className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <h4 className={`font-medium ${
                    pendingStatus === "active" ? "text-green-900" :
                    pendingStatus === "inactive" ? "text-amber-900" :
                    "text-red-900"
                  }`}>
                    {pendingStatus === "active" && "Activate School"}
                    {pendingStatus === "inactive" && "Deactivate School"}
                    {pendingStatus === "suspended" && "Suspend School"}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    pendingStatus === "active" ? "text-green-700" :
                    pendingStatus === "inactive" ? "text-amber-700" :
                    "text-red-700"
                  }`}>
                    {pendingStatus === "active" && "This will activate the school and allow all users to access it."}
                    {pendingStatus === "inactive" && "This will deactivate the school but keep all data intact."}
                    {pendingStatus === "suspended" && "This will suspend the school and restrict access for security reasons."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-reason" className="text-sm font-medium text-slate-700">
                Reason (Optional)
              </Label>
              <Textarea
                id="status-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Provide a reason for this status change..."
                rows={3}
                className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsStatusModalOpen(false);
                setPendingStatus("");
                setStatusReason("");
              }}
              className="rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={updating}
              className={`rounded-lg ${
                pendingStatus === "active"
                  ? "bg-green-600 hover:bg-green-700"
                  : pendingStatus === "inactive"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  {pendingStatus === "active" && <Power className="w-4 h-4 mr-2" />}
                  {pendingStatus === "inactive" && <Archive className="w-4 h-4 mr-2" />}
                  {pendingStatus === "suspended" && <AlertTriangle className="w-4 h-4 mr-2" />}
                  {pendingStatus === "active" && "Activate"}
                  {pendingStatus === "inactive" && "Deactivate"}
                  {pendingStatus === "suspended" && "Suspend"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete School Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-600" />
              Delete School
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900">Dangerous Action</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete the school and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {school && (school._count.admins + school._count.teachers + school._count.students) > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900">Active Users Detected</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This school has {school._count.admins + school._count.teachers + school._count.students} active users.
                      Deleting this school will remove all user data and cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-medium text-slate-900 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• School configuration and settings</li>
                <li>• All admin, teacher, and student accounts</li>
                <li>• All attendance and payment records</li>
                <li>• All audit logs and system data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="text-sm font-medium text-slate-700">
                Type "DELETE" to confirm
              </Label>
              <Input
                id="delete-confirmation"
                placeholder="Type DELETE to confirm"
                className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSchool}
              disabled={updating || statusReason !== "DELETE"}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete School
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-slate-600" />
              Add New User
            </DialogTitle>
          </DialogHeader>

          <UserForm onSubmit={handleAddUser} onCancel={() => setIsAddUserModalOpen(false)} loading={updating} />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center">
              <Edit className="w-5 h-5 mr-2 text-slate-600" />
              Edit User
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSubmit={(data) => handleEditUser(selectedUser.id, data)}
              onCancel={() => {
                setIsEditUserModalOpen(false);
                setSelectedUser(null);
              }}
              loading={updating}
              isEdit={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit School Panel */}
      <SchoolEditPanel
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        school={school}
        onSuccess={() => {
          fetchSchoolDetails();
          setIsEditPanelOpen(false);
        }}
      />
    </div>
  );
}

// User Form Component
function UserForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  isEdit = false
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    username: initialData?.username || '',
    email: initialData?.email || '',
    phone: initialData?.phone || initialData?.phoneno || '',
    role: initialData?.role || 'student',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!isEdit && !formData.password) newErrors.password = 'Password is required';
    if (!isEdit && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      phone: formData.phone || undefined,
      password: formData.password || undefined,
    };

    delete submitData.confirmPassword;
    onSubmit(submitData);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'teacher': return <BookOpen className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'controller': return <UserCog className="w-4 h-4" />;
      case 'registral': return <FileText className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-amber-600';
      case 'teacher': return 'text-purple-600';
      case 'student': return 'text-blue-600';
      case 'controller': return 'text-emerald-600';
      case 'registral': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="user-name" className="text-sm font-medium text-slate-700">
            Full Name *
          </Label>
          <Input
            id="user-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${errors.name ? 'border-red-300' : ''}`}
            required
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-username" className="text-sm font-medium text-slate-700">
            Username *
          </Label>
          <Input
            id="user-username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className={`rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${errors.username ? 'border-red-300' : ''}`}
            required
          />
          {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email" className="text-sm font-medium text-slate-700">
            Email Address *
          </Label>
          <Input
            id="user-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${errors.email ? 'border-red-300' : ''}`}
            required
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-phone" className="text-sm font-medium text-slate-700">
            Phone Number
          </Label>
          <Input
            id="user-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="user-role" className="text-sm font-medium text-slate-700">
            Role *
          </Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                  Student
                </div>
              </SelectItem>
              <SelectItem value="teacher">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                  Teacher
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-amber-600" />
                  Administrator
                </div>
              </SelectItem>
              <SelectItem value="controller">
                <div className="flex items-center">
                  <UserCog className="w-4 h-4 mr-2 text-emerald-600" />
                  Controller
                </div>
              </SelectItem>
              <SelectItem value="registral">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-rose-600" />
                  Registral
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isEdit && (
          <>
            <div className="space-y-2">
              <Label htmlFor="user-password" className="text-sm font-medium text-slate-700">
                Password *
              </Label>
              <Input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${errors.password ? 'border-red-300' : ''}`}
                required={!isEdit}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-confirm-password" className="text-sm font-medium text-slate-700">
                Confirm Password *
              </Label>
              <Input
                id="user-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                required={!isEdit}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        {isEdit && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="user-password" className="text-sm font-medium text-slate-700">
              New Password (leave empty to keep current)
            </Label>
            <Input
              id="user-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              placeholder="Enter new password"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-lg border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEdit ? <Save className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {isEdit ? 'Update User' : 'Create User'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

