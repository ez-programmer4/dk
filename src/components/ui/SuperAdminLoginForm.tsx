"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

interface SuperAdminLoginFormProps {
  callbackUrl?: string;
}

export function SuperAdminLoginForm({
  callbackUrl,
}: SuperAdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
        role: "superAdmin",
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid username or password" : res.error);
        setIsSubmitting(false);
      } else {
        // Success - show brief success state before redirect
        setIsSubmitting(true);
        // Small delay to show success state
        setTimeout(() => {
          if (callbackUrl) {
            router.push(callbackUrl);
          } else {
            router.push("/super-admin/dashboard");
          }
        }, 500);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Authentication failed"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="group"
        >
          <Label
            htmlFor="username"
            className="block text-sm font-bold text-black mb-2 uppercase tracking-wider"
          >
            Username
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
            </div>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-12 appearance-none block w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white hover:border-gray-400 text-black font-medium"
              placeholder="Enter your username"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="group"
        >
          <Label
            htmlFor="password"
            className="block text-sm font-bold text-black mb-2 uppercase tracking-wider"
          >
            Password
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 appearance-none block w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white hover:border-gray-400 text-black font-medium"
              placeholder="Enter your password"
            />
          </div>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-500 rounded-lg"
        >
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-4 px-6 border-2 border-black rounded-lg text-sm font-black text-white bg-black hover:bg-gray-900 hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>ACCESS PORTAL</span>
              <FiArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
