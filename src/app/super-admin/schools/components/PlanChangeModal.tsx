"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Users,
  Database,
  Zap,
  Shield,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Plan {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  perStudentPrice: number;
  isActive: boolean;
  features?: string[];
  maxStudents?: number;
  description?: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
  currentPlanId?: string;
}

interface PlanChangeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  school: School | null;
  plans: Plan[];
  onSuccess: () => void;
}

export function PlanChangeModal({
  isOpen,
  onOpenChange,
  school,
  plans,
  onSuccess,
}: PlanChangeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [changing, setChanging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (school?.currentPlanId) {
      setSelectedPlanId(school.currentPlanId);
    } else {
      setSelectedPlanId("");
    }
  }, [school]);

  const handleChangePlan = async () => {
    if (!school || !selectedPlanId) return;

    setChanging(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (response.ok) {
        setSuccessMessage(`Plan changed successfully for ${school.name}!`);
        setTimeout(() => {
          onOpenChange(false);
          setSuccessMessage("");
          onSuccess();
        }, 2000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to change plan");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Failed to change plan:", error);
      setErrorMessage("Failed to change plan. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setChanging(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('user') || feature.toLowerCase().includes('student')) {
      return Users;
    }
    if (feature.toLowerCase().includes('database') || feature.toLowerCase().includes('storage')) {
      return Database;
    }
    if (feature.toLowerCase().includes('performance') || feature.toLowerCase().includes('speed')) {
      return Zap;
    }
    if (feature.toLowerCase().includes('security') || feature.toLowerCase().includes('protection')) {
      return Shield;
    }
    return CheckCircle2;
  };

  const formatPrice = (plan: Plan) => {
    if (plan.basePrice === 0) {
      return "Free";
    }
    return `${plan.currency} ${plan.basePrice}${plan.perStudentPrice > 0 ? ` + ${plan.currency} ${plan.perStudentPrice}/student` : ''}`;
  };

  if (!school) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[1000px] max-h-[95vh] bg-transparent border-0 shadow-none p-0">
        <div className="relative w-full h-full bg-gradient-to-br from-white/95 via-slate-50/90 to-gray-50/85 backdrop-blur-3xl rounded-3xl border border-white/40 shadow-2xl overflow-hidden max-h-[95vh] ring-1 ring-white/20 flex flex-col">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-400/15 to-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          </div>

          {/* Toast Notifications */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="fixed top-6 right-6 z-50 bg-black text-white rounded-2xl p-4 shadow-2xl border border-white/20 max-w-md backdrop-blur-sm"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-semibold flex-1">{errorMessage}</p>
                  <button onClick={() => setErrorMessage("")} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="fixed top-6 right-6 z-50 bg-white text-black rounded-2xl p-4 shadow-2xl border border-black/20 max-w-md backdrop-blur-sm"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                  <p className="font-semibold flex-1">{successMessage}</p>
                  <button onClick={() => setSuccessMessage("")} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex-shrink-0 p-8 pb-6">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm">
                  <CreditCard className="w-12 h-12 text-emerald-600" />
                </div>
              </div>

              <DialogTitle className="text-4xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-4 tracking-tight">
                Change Plan for {school.name}
              </DialogTitle>
              <p className="text-gray-600 text-lg font-medium leading-relaxed">
                Select a new plan for this school. Changes will take effect immediately.
              </p>
            </motion.div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="px-8 pb-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan, index) => {
                  const IconComponent = getFeatureIcon(plan.name);
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrentPlan = school.currentPlanId === plan.id;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="relative"
                    >
                      <Card
                        className={`relative cursor-pointer transition-all duration-300 border-2 hover:shadow-2xl ${
                          isSelected
                            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl"
                            : "border-gray-200 hover:border-emerald-300 bg-white/90 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/50"
                        } ${isCurrentPlan ? "ring-2 ring-emerald-200" : ""}`}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        {isCurrentPlan && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Current Plan
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="text-center pb-4">
                          <div className="flex items-center justify-center mb-4">
                            <div className={`p-4 rounded-2xl ${
                              isSelected ? "bg-emerald-100" : "bg-gray-100"
                            }`}>
                              <IconComponent className={`w-8 h-8 ${
                                isSelected ? "text-emerald-600" : "text-gray-600"
                              }`} />
                            </div>
                          </div>
                          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            {plan.name}
                          </CardTitle>
                          <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {formatPrice(plan)}
                          </div>
                          {plan.maxStudents && (
                            <div className="text-sm text-gray-600 mt-2">
                              Up to {plan.maxStudents} students
                            </div>
                          )}
                        </CardHeader>

                        <CardContent>
                          {plan.description && (
                            <p className="text-gray-600 text-sm mb-4 text-center">
                              {plan.description}
                            </p>
                          )}

                          {plan.features && plan.features.length > 0 && (
                            <div className="space-y-2">
                              {plan.features.slice(0, 4).map((feature, featureIndex) => {
                                const FeatureIcon = getFeatureIcon(feature);
                                return (
                                  <div key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                                    <FeatureIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                );
                              })}
                              {plan.features.length > 4 && (
                                <div className="text-sm text-gray-500 text-center pt-2">
                                  +{plan.features.length - 4} more features
                                </div>
                              )}
                            </div>
                          )}

                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-4 right-4"
                            >
                              <div className="bg-emerald-500 rounded-full p-1">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <motion.div
            className="flex-shrink-0 border-t border-white/20 bg-gradient-to-r from-emerald-50/40 via-teal-50/30 to-cyan-50/40 backdrop-blur-md px-8 py-8 shadow-inner"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-4">
                <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40">
                  <div className="text-sm font-bold text-gray-700">
                    {selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.name : "No plan selected"}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-2 border-gray-300 hover:border-gray-400 hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl px-8 py-4 font-bold shadow-md text-gray-700 hover:text-gray-800"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleChangePlan}
                    disabled={changing || !selectedPlanId || selectedPlanId === school.currentPlanId}
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-10 py-4 font-bold text-lg border-2 border-transparent hover:border-white/20"
                  >
                    {changing ? (
                      <div className="flex items-center">
                        <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                        Changing Plan...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ArrowRight className="w-6 h-6 mr-3" />
                        Change Plan
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



