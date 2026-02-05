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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: "#1f2937",
    secondaryColor: "#6b7280",
    accentColor: "#3b82f6",
    schoolName: "",
    isSetupComplete: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, [schoolSlug]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/${schoolSlug}/settings`);
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
      const response = await fetch(`/api/admin/${schoolSlug}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          isSetupComplete: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, isSetupComplete: true }));
        setMessage({ type: "success", text: "Branding settings saved successfully!" });
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
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      accentColor: "#3b82f6",
      schoolName: "",
      isSetupComplete: false,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Branding Setup</h1>
          <p className="text-gray-600 mt-1">
            Customize your school's appearance and brand identity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {settings.isSetupComplete && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Setup Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Setup Progress</h3>
            <span className="text-sm text-gray-600">
              {settings.isSetupComplete ? "Complete" : "In Progress"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: settings.isSetupComplete ? "100%" : "60%" }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Color Scheme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#1f2937"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  id="accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="schoolName">School Display Name</Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                placeholder="Enter your school name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="tagline">Tagline (Optional)</Label>
              <Input
                id="tagline"
                value={settings.tagline || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="A brief description of your school"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Logo Upload</Label>
              <div className="mt-2">
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-600 mt-2">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border"
            style={{
              background: `linear-gradient(135deg, ${settings.secondaryColor}15 0%, ${settings.accentColor}10 100%)`,
              borderColor: settings.primaryColor + '30'
            }}
          >
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {settings.schoolName.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: settings.primaryColor }}
                >
                  {settings.schoolName || 'Your School Name'}
                </h3>
                {settings.tagline && (
                  <p className="text-sm text-gray-600">{settings.tagline}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                size="sm"
                style={{
                  backgroundColor: settings.accentColor,
                  borderColor: settings.accentColor
                }}
              >
                Primary Action
              </Button>
              <Button size="sm" variant="outline">
                Secondary Action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
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
            className="flex items-center"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}