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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface SuperAdminSettings {
  telegramBotToken: string;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SuperAdminSettings>({
    telegramBotToken: "",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure global platform settings and integrations
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Telegram Bot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="telegramBotToken">Global Telegram Bot Token</Label>
              <p className="text-sm text-gray-600">
                This token will be used by all schools for sending zoom links and notifications via Telegram bot.
              </p>
            </div>

            <div>
              <div className="relative">
                <Input
                  id="telegramBotToken"
                  type={showToken ? "text" : "password"}
                  value={settings.telegramBotToken}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="Enter bot token (e.g., bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {settings.telegramBotToken && (
                    <Badge variant={isValidToken(settings.telegramBotToken) ? "secondary" : "destructive"}>
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
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testBotToken}
                  disabled={testing || !settings.telegramBotToken}
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

              <div className="text-xs text-gray-500 mt-2">
                <p>Get your bot token from <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@BotFather</a> on Telegram</p>
                <p>Format: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">bot&lt;token&gt;</code> or <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;number&gt;:&lt;string&gt;</code></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Global Bot Status</h4>
                  <p className="text-sm text-gray-600">Telegram bot integration status</p>
                </div>
                <Badge variant={settings.telegramBotToken ? "secondary" : "outline"}>
                  {settings.telegramBotToken ? "Configured" : "Not Configured"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Schools Using Bot</h4>
                  <p className="text-sm text-gray-600">Number of schools with active telegram features</p>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Bot Message Count</h4>
                  <p className="text-sm text-gray-600">Total messages sent via bot this month</p>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}




