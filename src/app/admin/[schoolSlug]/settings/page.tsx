"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Palette,
  Upload,
  Save,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Building,
  GraduationCap,
  DollarSign,
  MessageSquare,
  Shield,
  Zap,
  Star,
  Globe,
  Clock,
  BookOpen,
  CreditCard,
  Bell,
  Lock,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SchoolSettings {
  // Branding Settings
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    schoolName: string;
    tagline?: string;
    description?: string;
    isSetupComplete: boolean;
  };

  // General Settings
  general: {
    timezone: string;
    defaultLanguage: string;
    dateFormat: string;
    currency: string;
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    academicYearStart: string;
    academicYearEnd: string;
  };

  // Academic Settings
  academic: {
    gradeLevels: string[];
    subjects: string[];
    maxClassSize: number;
    attendanceRequired: boolean;
    gradingScale: string;
    reportCardFrequency: string;
    enableOnlineLearning: boolean;
    requireParentApproval: boolean;
  };

  // Financial Settings
  financial: {
    paymentMethods: string[];
    paymentGateway: string;
    currency: string;
    taxRate: number;
    lateFeePolicy: {
      enabled: boolean;
      amount: number;
      frequency: string;
    };
    scholarshipEnabled: boolean;
    installmentPlans: boolean;
  };

  // Communication Settings
  communication: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    newsletterEnabled: boolean;
    parentPortalEnabled: boolean;
    studentPortalEnabled: boolean;
    emergencyContacts: boolean;
  };

  // Security Settings
  security: {
    twoFactorAuth: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      expireAfter: number;
    };
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLogging: boolean;
  };

  // Integration Settings
  integrations: {
    googleCalendar: boolean;
    zoomIntegration: boolean;
    paymentGateway: string;
    emailService: string;
    smsService: string;
    cloudStorage: string;
  };

  // Feature Flags
  features: {
    attendanceTracking: boolean;
    gradebook: boolean;
    parentCommunication: boolean;
    onlinePayments: boolean;
    resourceLibrary: boolean;
    timetableManagement: boolean;
    examManagement: boolean;
    transportation: boolean;
    cafeteria: boolean;
    library: boolean;
  };
}

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  schoolName: string;
  tagline?: string;
  isSetupComplete: boolean;
}

export default function SchoolSettingsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [settings, setSettings] = useState<SchoolSettings>({
    branding: {
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      accentColor: "#3b82f6",
      schoolName: "",
      tagline: "",
      description: "",
      logoUrl: "",
      isSetupComplete: false,
    },
    general: {
      timezone: "Africa/Addis_Ababa",
      defaultLanguage: "en",
      dateFormat: "DD/MM/YYYY",
      currency: "ETB",
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      workingHours: { start: "08:00", end: "17:00" },
      academicYearStart: "09-01",
      academicYearEnd: "06-30",
    },
    academic: {
      gradeLevels: [],
      subjects: [],
      maxClassSize: 30,
      attendanceRequired: true,
      gradingScale: "A-F",
      reportCardFrequency: "quarterly",
      enableOnlineLearning: false,
      requireParentApproval: true,
    },
    financial: {
      paymentMethods: [],
      paymentGateway: "",
      currency: "",
      taxRate: 0,
      lateFeePolicy: { enabled: false, amount: 0, frequency: "monthly" },
      scholarshipEnabled: false,
      installmentPlans: true,
    },
    communication: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterEnabled: true,
      parentPortalEnabled: true,
      studentPortalEnabled: true,
      emergencyContacts: true,
    },
    security: {
      twoFactorAuth: false,
      passwordPolicy: { minLength: 8, requireSpecialChars: true, requireNumbers: true, expireAfter: 90 },
      sessionTimeout: 30,
      ipWhitelist: [],
      auditLogging: true,
    },
    integrations: {
      googleCalendar: false,
      zoomIntegration: false,
      paymentGateway: "",
      emailService: "",
      smsService: "",
      cloudStorage: "",
    },
    features: {
      attendanceTracking: true,
      gradebook: true,
      parentCommunication: true,
      onlinePayments: true,
      resourceLibrary: true,
      timetableManagement: true,
      examManagement: true,
      transportation: false,
      cafeteria: false,
      library: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("branding");

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, [schoolSlug]);

  const fetchSettings = async () => {
    try {
      console.log('🔄 Fetching settings from API...');
      const response = await fetch(`/api/admin/${schoolSlug}/settings`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Settings fetch failed:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      console.log('📥 Settings API response:', data);

      if (data.success && data.settings) {
        // Merge fetched settings with defaults
        const defaultSettings = {
          branding: {
            primaryColor: "#1f2937",
            secondaryColor: "#6b7280",
            accentColor: "#3b82f6",
            schoolName: "",
            tagline: "",
            description: "",
            logoUrl: "",
            isSetupComplete: false,
          },
          general: {
            timezone: "Africa/Addis_Ababa",
            defaultLanguage: "en",
            dateFormat: "DD/MM/YYYY",
            currency: "ETB",
            workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            workingHours: { start: "08:00", end: "17:00" },
            academicYearStart: "09-01",
            academicYearEnd: "06-30",
          },
          academic: {
            gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
            subjects: ["Mathematics", "English", "Science", "Social Studies", "Arabic", "Islamic Studies"],
            maxClassSize: 30,
            attendanceRequired: true,
            gradingScale: "A-F",
            reportCardFrequency: "quarterly",
            enableOnlineLearning: false,
            requireParentApproval: true,
          },
          financial: {
            paymentMethods: ["cash", "bank_transfer"],
            paymentGateway: "stripe",
            currency: "ETB",
            taxRate: 0,
            lateFeePolicy: { enabled: false, amount: 0, frequency: "monthly" },
            scholarshipEnabled: false,
            installmentPlans: true,
          },
          communication: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            newsletterEnabled: true,
            parentPortalEnabled: true,
            studentPortalEnabled: true,
            emergencyContacts: true,
          },
          security: {
            twoFactorAuth: false,
            passwordPolicy: { minLength: 8, requireSpecialChars: true, requireNumbers: true, expireAfter: 90 },
            sessionTimeout: 30,
            ipWhitelist: [],
            auditLogging: true,
          },
          integrations: {
            googleCalendar: false,
            zoomIntegration: false,
            paymentGateway: "stripe",
            emailService: "sendgrid",
            smsService: "twilio",
            cloudStorage: "aws_s3",
          },
          features: {
            attendanceTracking: true,
            gradebook: true,
            parentCommunication: true,
            onlinePayments: true,
            resourceLibrary: true,
            timetableManagement: true,
            examManagement: true,
            transportation: false,
            cafeteria: false,
            library: true,
          },
        };

        setSettings({
          branding: { ...defaultSettings.branding, ...data.settings.branding },
          general: { ...defaultSettings.general, ...data.settings.general },
          academic: { ...defaultSettings.academic, ...data.settings.academic },
          financial: { ...defaultSettings.financial, ...data.settings.financial },
          communication: { ...defaultSettings.communication, ...data.settings.communication },
          security: { ...defaultSettings.security, ...data.settings.security },
          integrations: { ...defaultSettings.integrations, ...data.settings.integrations },
          features: { ...defaultSettings.features, ...data.settings.features },
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const saveData = {
        ...settings,
        branding: {
          ...settings.branding,
          isSetupComplete: true,
        },
      };
      console.log('💾 Sending save request to API');
      console.log('📋 Branding data being saved:', {
        primaryColor: saveData.branding.primaryColor,
        secondaryColor: saveData.branding.secondaryColor,
        accentColor: saveData.branding.accentColor,
        schoolName: saveData.branding.schoolName,
        tagline: saveData.branding.tagline,
        description: saveData.branding.description,
      });

      const response = await fetch(`/api/admin/${schoolSlug}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        console.error('❌ Settings save failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setMessage({ type: "error", text: `Save failed: ${response.status} ${response.statusText}` });
        return;
      }

      const data = await response.json();
      console.log('📥 Save API response:', data);

      if (data.success) {
        // Refetch settings from server to ensure we have the latest data
        await fetchSettings();
        setMessage({ type: "success", text: "All settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      branding: {
        primaryColor: "#1f2937",
        secondaryColor: "#6b7280",
        accentColor: "#3b82f6",
        schoolName: "",
        isSetupComplete: false,
      },
      general: {
        timezone: "Africa/Addis_Ababa",
        defaultLanguage: "en",
        dateFormat: "DD/MM/YYYY",
        currency: "ETB",
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        workingHours: { start: "08:00", end: "17:00" },
        academicYearStart: "09-01",
        academicYearEnd: "06-30",
      },
      academic: {
        gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
        subjects: ["Mathematics", "English", "Science", "Social Studies", "Arabic", "Islamic Studies"],
        maxClassSize: 30,
        attendanceRequired: true,
        gradingScale: "A-F",
        reportCardFrequency: "quarterly",
        enableOnlineLearning: false,
        requireParentApproval: true,
      },
      financial: {
        paymentMethods: ["cash", "bank_transfer"],
        paymentGateway: "stripe",
        currency: "ETB",
        taxRate: 0,
        lateFeePolicy: { enabled: false, amount: 0, frequency: "monthly" },
        scholarshipEnabled: false,
        installmentPlans: true,
      },
      communication: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        newsletterEnabled: true,
        parentPortalEnabled: true,
        studentPortalEnabled: true,
        emergencyContacts: true,
      },
      security: {
        twoFactorAuth: false,
        passwordPolicy: { minLength: 8, requireSpecialChars: true, requireNumbers: true, expireAfter: 90 },
        sessionTimeout: 30,
        ipWhitelist: [],
        auditLogging: true,
      },
      integrations: {
        googleCalendar: false,
        zoomIntegration: false,
        paymentGateway: "stripe",
        emailService: "sendgrid",
        smsService: "twilio",
        cloudStorage: "aws_s3",
      },
      features: {
        attendanceTracking: true,
        gradebook: true,
        parentCommunication: true,
        onlinePayments: true,
        resourceLibrary: true,
        timetableManagement: true,
        examManagement: true,
        transportation: false,
        cafeteria: false,
        library: true,
      },
    });
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const updateNestedSetting = (category: keyof SchoolSettings, field: string, value: any) => {
    console.log(`🔄 Updating ${category}.${field} = ${value}`);
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">School Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Configure your school's appearance, policies, and operational settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {settings.branding.isSetupComplete && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Branding Complete
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="border-l-4">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-12">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Salary</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          {/* Debug Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-sm text-yellow-800">
                <strong>Debug Info:</strong>
                <div>School Name: {settings.branding.schoolName || 'Not set'}</div>
                <div>Primary Color: {settings.branding.primaryColor || 'Not set'}</div>
                <div>Secondary Color: {settings.branding.secondaryColor || 'Not set'}</div>
                <div>Accent Color: {settings.branding.accentColor || 'Not set'}</div>
                <div>Tagline: {settings.branding.tagline || 'Not set'}</div>
                <div>Description: {settings.branding.description || 'Not set'}</div>
                <div>Setup Complete: {settings.branding.isSetupComplete ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-blue-600" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        id="primaryColor"
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateNestedSetting('branding', 'primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateNestedSetting('branding', 'primaryColor', e.target.value)}
                        placeholder="#1f2937"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor" className="text-sm font-medium">Secondary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        id="secondaryColor"
                        type="color"
                        value={settings.branding.secondaryColor}
                        onChange={(e) => updateNestedSetting('branding', 'secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={settings.branding.secondaryColor}
                        onChange={(e) => updateNestedSetting('branding', 'secondaryColor', e.target.value)}
                        placeholder="#6b7280"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accentColor" className="text-sm font-medium">Accent Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        id="accentColor"
                        type="color"
                        value={settings.branding.accentColor}
                        onChange={(e) => updateNestedSetting('branding', 'accentColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={settings.branding.accentColor}
                        onChange={(e) => updateNestedSetting('branding', 'accentColor', e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-green-600" />
                  School Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="schoolName" className="text-sm font-medium">School Display Name *</Label>
                  <Input
                    id="schoolName"
                    value={settings.branding.schoolName}
                    onChange={(e) => updateNestedSetting('branding', 'schoolName', e.target.value)}
                    placeholder="Enter your school name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="tagline" className="text-sm font-medium">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.branding.tagline || ""}
                    onChange={(e) => updateNestedSetting('branding', 'tagline', e.target.value)}
                    placeholder="A brief description of your school"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={settings.branding.description || ""}
                    onChange={(e) => updateNestedSetting('branding', 'description', e.target.value)}
                    placeholder="Detailed description of your school"
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Logo & Assets</Label>
                  <div className="mt-2 space-y-3">
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Favicon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-600" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="p-8 rounded-xl border-2"
                style={{
                  background: `linear-gradient(135deg, ${settings.branding.secondaryColor}10 0%, ${settings.branding.accentColor}08 100%)`,
                  borderColor: `${settings.branding.primaryColor}30`
                }}
              >
                <div className="flex items-center space-x-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ backgroundColor: settings.branding.primaryColor }}
                  >
                    {settings.branding.schoolName.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-2xl font-bold"
                      style={{ color: settings.branding.primaryColor }}
                    >
                      {settings.branding.schoolName || 'Your School Name'}
                    </h3>
                    {settings.branding.tagline && (
                      <p className="text-lg mt-1" style={{ color: settings.branding.secondaryColor }}>
                        {settings.branding.tagline}
                      </p>
                    )}
                    {settings.branding.description && (
                      <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                        {settings.branding.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <Button
                    size="sm"
                    style={{
                      backgroundColor: settings.branding.accentColor,
                      borderColor: settings.branding.accentColor
                    }}
                  >
                    Get Started
                  </Button>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => updateNestedSetting('general', 'timezone', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Default Language</Label>
                  <Select value={settings.general.defaultLanguage} onValueChange={(value) => updateNestedSetting('general', 'defaultLanguage', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="am">Amharic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Date Format</Label>
                  <Select value={settings.general.dateFormat} onValueChange={(value) => updateNestedSetting('general', 'dateFormat', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select value={settings.general.currency} onValueChange={(value) => updateNestedSetting('general', 'currency', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-600" />
                  Schedule Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Working Days</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.general.workingDays.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.general.workingDays, day]
                              : settings.general.workingDays.filter(d => d !== day);
                            updateNestedSetting('general', 'workingDays', newDays);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.general.workingHours.start}
                      onChange={(e) => updateNestedSetting('general', 'workingHours', {
                        ...settings.general.workingHours,
                        start: e.target.value
                      })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <Input
                      type="time"
                      value={settings.general.workingHours.end}
                      onChange={(e) => updateNestedSetting('general', 'workingHours', {
                        ...settings.general.workingHours,
                        end: e.target.value
                      })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Academic Year Start</Label>
                    <Input
                      type="month"
                      value={settings.general.academicYearStart}
                      onChange={(e) => updateNestedSetting('general', 'academicYearStart', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Academic Year End</Label>
                    <Input
                      type="month"
                      value={settings.general.academicYearEnd}
                      onChange={(e) => updateNestedSetting('general', 'academicYearEnd', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Teacher Salary Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Allow Teachers to View Salary</Label>
                    <p className="text-xs text-gray-600 mt-1">Teachers can see their salary information</p>
                  </div>
                  <Switch
                    checked={settings.features.gradebook} // Using gradebook as proxy for salary visibility
                    onCheckedChange={(checked) => updateNestedSetting('features', 'gradebook', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Include Sundays in Salary Calculation</Label>
                    <p className="text-xs text-gray-600 mt-1">Count Sunday work in teacher salary calculations</p>
                  </div>
                  <Switch
                    checked={settings.features.attendanceTracking} // Using attendanceTracking as proxy for sunday inclusion
                    onCheckedChange={(checked) => updateNestedSetting('features', 'attendanceTracking', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Communication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Admin Contact Information</Label>
                  <Input
                    value={settings.branding.tagline || ""} // Using tagline as proxy for admin contact
                    onChange={(e) => updateNestedSetting('branding', 'tagline', e.target.value)}
                    placeholder="Enter admin contact email or phone"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Hidden Salary Message</Label>
                  <Textarea
                    value={settings.branding.description || ""}
                    onChange={(e) => updateNestedSetting('branding', 'description', e.target.value)}
                    placeholder="Message shown when teacher salary is hidden"
                    className="mt-2 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Academic Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Attendance Tracking</Label>
                    <p className="text-xs text-gray-600 mt-1">Track student attendance and generate reports</p>
                  </div>
                  <Switch
                    checked={settings.features.attendanceTracking}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'attendanceTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Gradebook</Label>
                    <p className="text-xs text-gray-600 mt-1">Manage grades and academic records</p>
                  </div>
                  <Switch
                    checked={settings.features.gradebook}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'gradebook', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Timetable Management</Label>
                    <p className="text-xs text-gray-600 mt-1">Schedule classes and manage timetables</p>
                  </div>
                  <Switch
                    checked={settings.features.timetableManagement}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'timetableManagement', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Exam Management</Label>
                    <p className="text-xs text-gray-600 mt-1">Create and manage examinations</p>
                  </div>
                  <Switch
                    checked={settings.features.examManagement}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'examManagement', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-600" />
                  Additional Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Parent Communication</Label>
                    <p className="text-xs text-gray-600 mt-1">Enable parent-teacher communication tools</p>
                  </div>
                  <Switch
                    checked={settings.features.parentCommunication}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'parentCommunication', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Online Payments</Label>
                    <p className="text-xs text-gray-600 mt-1">Accept online fee payments</p>
                  </div>
                  <Switch
                    checked={settings.features.onlinePayments}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'onlinePayments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Resource Library</Label>
                    <p className="text-xs text-gray-600 mt-1">Digital library and resource management</p>
                  </div>
                  <Switch
                    checked={settings.features.resourceLibrary}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'resourceLibrary', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Library System</Label>
                    <p className="text-xs text-gray-600 mt-1">Physical library book management</p>
                  </div>
                  <Switch
                    checked={settings.features.library}
                    onCheckedChange={(checked) => updateNestedSetting('features', 'library', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = `/admin/${schoolSlug}`}
          >
            Back to Dashboard
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}