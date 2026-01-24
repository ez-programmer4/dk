"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Globe,
  Shield,
  CreditCard,
  Mail,
  ToggleLeft,
  Database,
  Key,
  Bell,
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/LoadingSpinner";

interface SystemSettings {
  platformName: string;
  platformDescription: string;
  defaultTimezone: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Security
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableTwoFactor: boolean;

  // Billing
  defaultBillingCycle: string;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  taxRate: number;

  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;

  // Features
  features: {
    zoomIntegration: boolean;
    analytics: boolean;
    telegramBot: boolean;
    customBranding: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    webhookSupport: boolean;
    mobileApp: boolean;
  };

  // API
  apiRateLimit: number;
  webhookUrl: string;

  // Data
  dataRetentionDays: number;
  autoBackup: boolean;
  backupFrequency: string;
}

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/super-admin/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      } else {
        // Initialize with default settings if none exist
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SystemSettings => ({
    platformName: "Darul Kubra",
    platformDescription: "Comprehensive School Management Platform",
    defaultTimezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
    maintenanceMode: false,
    maintenanceMessage: "System is currently under maintenance. Please check back later.",

    passwordMinLength: 8,
    sessionTimeout: 480, // 8 hours in minutes
    maxLoginAttempts: 5,
    enableTwoFactor: false,

    defaultBillingCycle: "monthly",
    stripeEnabled: false,
    paypalEnabled: false,
    taxRate: 0,

    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "noreply@darulkubra.com",
    fromName: "Darul Kubra",

    features: {
      zoomIntegration: true,
      analytics: true,
      telegramBot: false,
      customBranding: false,
      advancedReports: false,
      apiAccess: false,
      webhookSupport: false,
      mobileApp: false,
    },

    apiRateLimit: 1000,
    webhookUrl: "",

    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: "daily",
  });

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Success
        console.log("Settings saved successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateFeature = (feature: string, enabled: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      features: { ...settings.features, [feature]: enabled },
    });
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load settings</p>
          <Button onClick={fetchSettings} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure platform-wide settings and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={fetchSettings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center">
              <ToggleLeft className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Platform Configuration
                  </CardTitle>
                  <CardDescription>
                    Basic platform settings and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={settings.platformName}
                      onChange={(e) => updateSetting("platformName", e.target.value)}
                      placeholder="Your Platform Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformDescription">Platform Description</Label>
                    <Textarea
                      id="platformDescription"
                      value={settings.platformDescription}
                      onChange={(e) => updateSetting("platformDescription", e.target.value)}
                      placeholder="Brief description of your platform"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultTimezone">Default Timezone</Label>
                      <Select
                        value={settings.defaultTimezone}
                        onValueChange={(value) => updateSetting("defaultTimezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Addis_Ababa">East Africa Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="Europe/London">GMT</SelectItem>
                          <SelectItem value="Asia/Dubai">Gulf Standard Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultCurrency">Default Currency</Label>
                      <Select
                        value={settings.defaultCurrency}
                        onValueChange={(value) => updateSetting("defaultCurrency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                          <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>
                    Control platform availability and maintenance messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">
                        Temporarily disable platform access for all users
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                    />
                  </div>

                  {settings.maintenanceMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={settings.maintenanceMessage}
                        onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                        placeholder="Message to display during maintenance"
                        rows={3}
                      />
                    </motion.div>
                  )}

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Maintenance Status</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {settings.maintenanceMode
                            ? "Platform is currently in maintenance mode. Only super admins can access the system."
                            : "Platform is operational and accessible to all users."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Password Policy
                  </CardTitle>
                  <CardDescription>
                    Configure password requirements and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={settings.passwordMinLength}
                      onChange={(e) => updateSetting("passwordMinLength", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting("maxLoginAttempts", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="30"
                      max="1440"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">
                      {Math.floor(settings.sessionTimeout / 60)} hours {settings.sessionTimeout % 60} minutes
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    Configure authentication and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableTwoFactor}
                      onCheckedChange={(checked) => updateSetting("enableTwoFactor", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Security Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Password Strength</span>
                        <Badge variant={settings.passwordMinLength >= 8 ? "default" : "secondary"}>
                          {settings.passwordMinLength >= 8 ? "Strong" : "Weak"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Login Protection</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Two-Factor Auth</span>
                        <Badge variant={settings.enableTwoFactor ? "default" : "secondary"}>
                          {settings.enableTwoFactor ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Billing Configuration
                  </CardTitle>
                  <CardDescription>
                    Default billing settings and payment gateways
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultBillingCycle">Default Billing Cycle</Label>
                    <Select
                      value={settings.defaultBillingCycle}
                      onValueChange={(value) => updateSetting("defaultBillingCycle", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="30"
                      step="0.01"
                      value={settings.taxRate}
                      onChange={(e) => updateSetting("taxRate", parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Gateways
                  </CardTitle>
                  <CardDescription>
                    Configure available payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Stripe Payments</Label>
                      <p className="text-sm text-gray-600">
                        Enable Stripe payment processing
                      </p>
                    </div>
                    <Switch
                      checked={settings.stripeEnabled}
                      onCheckedChange={(checked) => updateSetting("stripeEnabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">PayPal Payments</Label>
                      <p className="text-sm text-gray-600">
                        Enable PayPal payment processing
                      </p>
                    </div>
                    <Switch
                      checked={settings.paypalEnabled}
                      onCheckedChange={(checked) => updateSetting("paypalEnabled", checked)}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Payment Status</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {settings.stripeEnabled || settings.paypalEnabled
                            ? "Payment processing is enabled"
                            : "No payment gateways configured"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>
                  Configure email server settings for system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting("smtpHost", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting("smtpPort", parseInt(e.target.value))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={settings.smtpUsername}
                      onChange={(e) => updateSetting("smtpUsername", e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={(e) => updateSetting("smtpPassword", e.target.value)}
                      placeholder="App password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      value={settings.fromEmail}
                      onChange={(e) => updateSetting("fromEmail", e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.fromName}
                      onChange={(e) => updateSetting("fromName", e.target.value)}
                      placeholder="Your Platform"
                    />
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">Email Configuration Status</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {settings.smtpHost && settings.smtpUsername
                          ? "Email server configured and ready"
                          : "Email server not configured"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ToggleLeft className="w-5 h-5 mr-2" />
                  Platform Features
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Zoom Integration</Label>
                        <p className="text-sm text-gray-600">
                          Enable video conferencing features
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.zoomIntegration}
                        onCheckedChange={(checked) => updateFeature("zoomIntegration", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Analytics Dashboard</Label>
                        <p className="text-sm text-gray-600">
                          Advanced reporting and insights
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.analytics}
                        onCheckedChange={(checked) => updateFeature("analytics", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Telegram Bot</Label>
                        <p className="text-sm text-gray-600">
                          Automated notifications via Telegram
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.telegramBot}
                        onCheckedChange={(checked) => updateFeature("telegramBot", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Custom Branding</Label>
                        <p className="text-sm text-gray-600">
                          School-specific branding options
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.customBranding}
                        onCheckedChange={(checked) => updateFeature("customBranding", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Advanced Reports</Label>
                        <p className="text-sm text-gray-600">
                          Detailed performance analytics
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.advancedReports}
                        onCheckedChange={(checked) => updateFeature("advancedReports", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">API Access</Label>
                        <p className="text-sm text-gray-600">
                          REST API for integrations
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.apiAccess}
                        onCheckedChange={(checked) => updateFeature("apiAccess", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Webhook Support</Label>
                        <p className="text-sm text-gray-600">
                          Real-time event notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.webhookSupport}
                        onCheckedChange={(checked) => updateFeature("webhookSupport", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Mobile App</Label>
                        <p className="text-sm text-gray-600">
                          Mobile application features
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.mobileApp}
                        onCheckedChange={(checked) => updateFeature("mobileApp", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Configure data retention and backup policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                    <Input
                      id="dataRetentionDays"
                      type="number"
                      min="30"
                      max="3650"
                      value={settings.dataRetentionDays}
                      onChange={(e) => updateSetting("dataRetentionDays", parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">
                      {Math.round(settings.dataRetentionDays / 365)} years of data retention
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Backups</Label>
                      <p className="text-sm text-gray-600">
                        Enable automated database backups
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                    />
                  </div>

                  {settings.autoBackup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={settings.backupFrequency}
                        onValueChange={(value) => updateSetting("backupFrequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure API access and webhook endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.apiRateLimit}
                      onChange={(e) => updateSetting("apiRateLimit", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={settings.webhookUrl}
                      onChange={(e) => updateSetting("webhookUrl", e.target.value)}
                      placeholder="https://your-app.com/webhook"
                    />
                    <p className="text-xs text-gray-500">
                      Endpoint for receiving platform events
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start">
                      <Bell className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-800">API Status</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          {settings.features.apiAccess
                            ? `API enabled with ${settings.apiRateLimit} requests/hour limit`
                            : "API access is disabled"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}














