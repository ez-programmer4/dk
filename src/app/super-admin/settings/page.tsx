"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Bot,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Users,
  Clock,
  Mail,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SuperAdminSettings {
  telegramBotToken: string;
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maxSchoolsPerAdmin: number;
  sessionTimeout: number;
  enableRegistration: boolean;
  defaultTimezone: string;
  defaultCurrency: string;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SuperAdminSettings>({
    telegramBotToken: "",
    platformName: "Darul Kubra Education System",
    platformDescription: "Comprehensive school management platform for Ethiopian educational institutions",
    supportEmail: "support@darulkubra.edu.et",
    maintenanceMode: false,
    maxSchoolsPerAdmin: 50,
    sessionTimeout: 480, // 8 hours in minutes
    enableRegistration: true,
    defaultTimezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/super-admin/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings || settings);
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
      const response = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const testBotToken = async () => {
    if (!settings.telegramBotToken.trim()) {
      setMessage({ type: "error", text: "Please enter a bot token first" });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/super-admin/settings/test-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: settings.telegramBotToken }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Bot token is valid and working!" });
      } else {
        setMessage({ type: "error", text: data.error || "Bot token test failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to test bot token. Please try again." });
    } finally {
      setTesting(false);
    }
  };

  const isValidToken = (token: string) => {
    return token.startsWith('bot') && token.length > 40 ||
           /^\d{8,10}:[a-zA-Z0-9_-]{35}$/.test(token);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl border border-white/20">
                    <SettingsIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                    System Settings
                  </h1>
                  <p className="text-slate-600 text-lg font-medium">
                    Configure global platform settings and integrations
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Secure & Encrypted</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Global Configuration</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span className="font-semibold">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Save All Settings</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="backdrop-blur-md bg-white/90 border-l-4">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">{message.text}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Integrations Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-md bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100/50">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mr-3">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  Integrations
                  <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">
                    Encrypted
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-6 space-y-6">
                {/* Telegram Bot Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegramBotToken" className="text-base font-semibold flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      Telegram Bot Token
                    </Label>
                    <p className="text-sm text-slate-600">
                      Global bot token for sending notifications and zoom links to all schools
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="telegramBotToken"
                        type={showToken ? "text" : "password"}
                        value={settings.telegramBotToken}
                        onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                        placeholder="bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        className="pr-12 h-12 bg-white/70 border-slate-200 hover:border-blue-300 focus:border-blue-400 transition-colors"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 hover:bg-slate-100"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {settings.telegramBotToken && (
                          <Badge variant={isValidToken(settings.telegramBotToken) ? "secondary" : "destructive"} className="px-3 py-1">
                            {isValidToken(settings.telegramBotToken) ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Valid Format
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Invalid Format
                              </>
                            )}
                          </Badge>
                        )}
                        {settings.telegramBotToken && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={testBotToken}
                        disabled={testing || !settings.telegramBotToken}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        {testing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-3 h-3 mr-2" />
                            Test Token
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                      <p className="mb-1">
                        <strong>Get your token:</strong>{" "}
                        <a
                          href="https://t.me/botfather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          @BotFather
                        </a>{" "}
                        on Telegram
                      </p>
                      <p>
                        <strong>Format:</strong>{" "}
                        <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">
                          bot&lt;token&gt;
                        </code>{" "}
                        or{" "}
                        <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">
                          &lt;number&gt;:&lt;string&gt;
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="backdrop-blur-md bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative bg-gradient-to-r from-emerald-50 to-cyan-50 border-b border-emerald-100/50">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg mr-3">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  General Settings
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                    Public
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-6 space-y-6">
                {/* Platform Name */}
                <div className="space-y-3">
                  <Label htmlFor="platformName" className="text-base font-semibold">
                    Platform Name
                  </Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                    placeholder="Darul Kubra Education System"
                    className="h-12 bg-white/70"
                  />
                </div>

                {/* Platform Description */}
                <div className="space-y-3">
                  <Label htmlFor="platformDescription" className="text-base font-semibold">
                    Platform Description
                  </Label>
                  <Input
                    id="platformDescription"
                    value={settings.platformDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, platformDescription: e.target.value }))}
                    placeholder="Comprehensive school management platform"
                    className="h-12 bg-white/70"
                  />
                </div>

                {/* Support Email */}
                <div className="space-y-3">
                  <Label htmlFor="supportEmail" className="text-base font-semibold flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                    Support Email
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    placeholder="support@darulkubra.edu.et"
                    className="h-12 bg-white/70"
                  />
                </div>

                {/* Default Timezone */}
                <div className="space-y-3">
                  <Label htmlFor="defaultTimezone" className="text-base font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                    Default Timezone
                  </Label>
                  <Select value={settings.defaultTimezone} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultTimezone: value }))}>
                    <SelectTrigger className="h-12 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                      <SelectItem value="Africa/Cairo">Eastern European Time (EET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Currency */}
                <div className="space-y-3">
                  <Label htmlFor="defaultCurrency" className="text-base font-semibold">
                    Default Currency
                  </Label>
                  <Select value={settings.defaultCurrency} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value }))}>
                    <SelectTrigger className="h-12 bg-white/70">
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
          </motion.div>

          {/* Security & Limits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="backdrop-blur-md bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100/50">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg mr-3">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  Security & Limits
                  <Badge className="ml-auto bg-red-100 text-red-700 border-red-200">
                    Protected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-6 space-y-6">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-red-600" />
                      <Label className="text-base font-semibold">Maintenance Mode</Label>
                    </div>
                    <p className="text-sm text-slate-600">Restrict access for system maintenance</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>

                {/* Enable Registration */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <Label className="text-base font-semibold">Enable Registration</Label>
                    </div>
                    <p className="text-sm text-slate-600">Allow new schools to register</p>
                  </div>
                  <Switch
                    checked={settings.enableRegistration}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableRegistration: checked }))}
                  />
                </div>

                {/* Session Timeout */}
                <div className="space-y-3">
                  <Label htmlFor="sessionTimeout" className="text-base font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-600" />
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="30"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 480 }))}
                    className="h-12 bg-white/70"
                  />
                  <p className="text-xs text-slate-500">
                    User sessions will expire after this many minutes of inactivity
                  </p>
                </div>

                {/* Max Schools per Admin */}
                <div className="space-y-3">
                  <Label htmlFor="maxSchoolsPerAdmin" className="text-base font-semibold flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Max Schools per Admin
                  </Label>
                  <Input
                    id="maxSchoolsPerAdmin"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.maxSchoolsPerAdmin}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxSchoolsPerAdmin: parseInt(e.target.value) || 50 }))}
                    className="h-12 bg-white/70"
                  />
                  <p className="text-xs text-slate-500">
                    Maximum number of schools a super admin can manage
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="backdrop-blur-md bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mr-3">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  System Status
                  <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-6 space-y-4">
                {/* Bot Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <Bot className="w-4 h-4 mr-2 text-blue-600" />
                      Telegram Bot Status
                    </h4>
                    <p className="text-sm text-slate-600">Integration status and connectivity</p>
                  </div>
                  <Badge variant={settings.telegramBotToken ? "secondary" : "outline"} className="px-3 py-1">
                    {settings.telegramBotToken ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Set
                      </>
                    )}
                  </Badge>
                </div>

                {/* Registration Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-emerald-600" />
                      School Registration
                    </h4>
                    <p className="text-sm text-slate-600">New school registration availability</p>
                  </div>
                  <Badge variant={settings.enableRegistration ? "secondary" : "outline"} className="px-3 py-1">
                    {settings.enableRegistration ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Disabled
                      </>
                    )}
                  </Badge>
                </div>

                {/* Maintenance Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <Wrench className="w-4 h-4 mr-2 text-orange-600" />
                      System Maintenance
                    </h4>
                    <p className="text-sm text-slate-600">Platform maintenance mode</p>
                  </div>
                  <Badge variant={settings.maintenanceMode ? "destructive" : "secondary"} className="px-3 py-1">
                    {settings.maintenanceMode ? (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Normal
                      </>
                    )}
                  </Badge>
                </div>

                {/* Platform Info */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">Platform Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Name:</span>
                      <p className="font-medium text-slate-800">{settings.platformName}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Currency:</span>
                      <p className="font-medium text-slate-800">{settings.defaultCurrency}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Timezone:</span>
                      <p className="font-medium text-slate-800">{settings.defaultTimezone}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Timeout:</span>
                      <p className="font-medium text-slate-800">{settings.sessionTimeout}m</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}








