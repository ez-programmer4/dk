"use client";
import { motion } from "framer-motion";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SchoolsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function SchoolsFilters({
  searchTerm,
  onSearchChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onExport,
  onRefresh,
}: SchoolsFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col lg:flex-row gap-6 mb-8"
    >
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Search className="w-5 h-5 text-white" />
          </div>
        </div>
        <Input
          placeholder="Search schools by name, slug, or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-16 h-14 border-2 border-gray-200 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl bg-white text-gray-900 text-lg placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-100 font-medium"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={onToggleAdvancedFilters}
            className="border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 rounded-2xl px-8 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
          >
            <Filter className="w-5 h-5 mr-3 text-indigo-600" />
            Advanced Filters
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={onExport}
            className="border-2 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 rounded-2xl px-8 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
          >
            <Download className="w-5 h-5 mr-3 text-emerald-600" />
            Export CSV
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 rounded-2xl px-6 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

