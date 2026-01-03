"use client";
import { motion } from "framer-motion";
import { Building2, Palette, CheckCircle2 } from "lucide-react";

interface StepItem {
  step: number;
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: StepItem[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="mt-16"
    >
      <div className="flex items-center justify-center space-x-6 mb-12">
        {steps.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={item.step} className="flex items-center">
              <motion.div
                className="flex flex-col items-center group"
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.5 + index * 0.15,
                  type: "spring",
                }}
              >
                <motion.div
                  className={`relative flex items-center justify-center w-20 h-20 rounded-3xl font-black text-xl transition-all duration-500 shadow-xl border-2 ${
                    currentStep >= item.step
                      ? `bg-gradient-to-br ${item.color} text-white border-white/30`
                      : "bg-white/90 text-gray-400 border-gray-200/50 backdrop-blur-sm"
                  }`}
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep > item.step ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <IconComponent className="w-8 h-8" />
                  )}
                  {currentStep === item.step && (
                    <motion.div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.color}`}
                      animate={{
                        boxShadow: [
                          `0 0 40px rgba(59, 130, 246, 0.6)`,
                          `0 0 80px rgba(59, 130, 246, 0.8)`,
                          `0 0 40px rgba(59, 130, 246, 0.6)`,
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </motion.div>
                <div className="mt-4 text-center">
                  <div
                    className={`text-base font-bold transition-colors duration-300 ${
                      currentStep >= item.step
                        ? "text-gray-800"
                        : "text-gray-400"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div
                    className={`text-sm mt-1 transition-colors duration-300 ${
                      currentStep >= item.step
                        ? "text-gray-600"
                        : "text-gray-300"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </motion.div>
              {index < 2 && (
                <motion.div
                  className={`w-32 h-2 mx-8 rounded-full shadow-inner ${
                    currentStep > item.step
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                      : "bg-gray-200/50"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: currentStep > item.step ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.6 + index * 0.1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
