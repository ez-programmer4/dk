"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, ArrowRight, Crown, Sparkles } from "lucide-react";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

function SuperAdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle authentication errors from URL params
  const authError = searchParams.get("error");
  const callbackUrl =
    searchParams.get("callbackUrl") || "/super-admin/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use NextAuth credentials provider for super admin authentication
      const result = await signIn("credentials", {
        username: email, // Pass email as username for super admin
        password,
        role: "superAdmin",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        // Redirect to dashboard on success
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-10"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden"
          >
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-3"
          >
            Super Admin
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-lg"
          >
            Platform Administration Portal
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-2xl border border-gray-100/50 bg-white/90 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-center">
                Access Platform Controls
              </CardTitle>
              <CardDescription className="text-center">
                Enter your super admin credentials to manage the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {(error || authError) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4"
                  >
                    <Alert variant="destructive">
                      <AlertDescription>
                        {error ||
                          "Access denied. Please check your credentials."}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="superadmin@platform.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !email.trim() || !password.trim()}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        />
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Shield className="w-5 h-5 mr-2" />
                        <span>Access Platform</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Back to Main Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to Regular Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>Platform Administration System</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Authorized personnel only • All actions are audited
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SuperAdminLoginContent />
    </Suspense>
  );
}
