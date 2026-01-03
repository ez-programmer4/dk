"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Eye, Edit, Trash2, Users, Calendar, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionTier: string;
  maxStudents: number;
  currentStudentCount: number;
  createdAt: string;
  planId?: string;
  _count: {
    admins: number;
    teachers: number;
    students: number;
  };
  revenue: number;
  primaryColor?: string;
  secondaryColor?: string;
}

interface SchoolsTableProps {
  schools: School[];
  loading: boolean;
  onViewSchool: (school: School) => void;
  onEditSchool: (school: School) => void;
  onDeleteSchool: (school: School) => void;
  onChangePlan: (school: School) => void;
}

export function SchoolsTable({
  schools,
  loading,
  onViewSchool,
  onEditSchool,
  onDeleteSchool,
  onChangePlan,
}: SchoolsTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getStatusColor = (status: School['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSchools = [...schools].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof School];
    let bValue: any = b[sortField as keyof School];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/40 shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600 font-medium">Loading schools...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/40 shadow-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 border-b border-white/20 hover:bg-gradient-to-r hover:from-indigo-50/70 hover:via-purple-50/50 hover:to-pink-50/70 transition-all duration-300">
              <TableHead
                className="font-bold text-gray-800 text-lg py-6 px-8 cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>School Name</span>
                  {sortField === 'name' && (
                    <span className="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="font-bold text-gray-800 text-lg py-6 px-8 cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('slug')}
              >
                <div className="flex items-center space-x-3">
                  <span>Slug</span>
                  {sortField === 'slug' && (
                    <span className="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="font-bold text-gray-800 text-lg py-6 px-8">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>Students</span>
                </div>
              </TableHead>
              <TableHead
                className="font-bold text-gray-800 text-lg py-6 px-8 cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>Created</span>
                  {sortField === 'createdAt' && (
                    <span className="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="font-bold text-gray-800 text-lg py-6 px-8">
                Status
              </TableHead>
              <TableHead className="font-bold text-gray-800 text-lg py-6 px-8">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSchools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Building2 className="w-16 h-16 text-gray-300" />
                    <p className="text-gray-500 text-lg font-medium">No schools found</p>
                    <p className="text-gray-400 text-sm">Create your first school to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedSchools.map((school, index) => (
                <motion.tr
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:via-purple-50/20 hover:to-pink-50/30 transition-all duration-300 group"
                >
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: school.primaryColor || '#3B82F6' }}
                      >
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">
                          {school.name}
                        </div>
                        <div className="text-gray-500 text-sm font-medium">
                          {school.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-700">
                      {school.slug}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-700">
                        {school._count.students || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="text-gray-600 font-medium">
                      {formatDate(school.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(school.status)} border-2 font-semibold px-4 py-2 rounded-xl`}
                    >
                      {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-10 w-10 p-0 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all duration-200 rounded-xl"
                        >
                          <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 bg-white/95 backdrop-blur-sm border border-white/40 shadow-xl rounded-2xl"
                      >
                        <DropdownMenuItem
                          onClick={() => onViewSchool(school)}
                          className="flex items-center space-x-3 py-3 px-4 rounded-xl hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium">View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditSchool(school)}
                          className="flex items-center space-x-3 py-3 px-4 rounded-xl hover:bg-purple-50 transition-colors"
                        >
                          <Edit className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Edit School</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onChangePlan(school)}
                          className="flex items-center space-x-3 py-3 px-4 rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                          <span className="w-5 h-5 text-emerald-600">📋</span>
                          <span className="font-medium">Change Plan</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteSchool(school)}
                          className="flex items-center space-x-3 py-3 px-4 rounded-xl hover:bg-red-50 transition-colors text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="font-medium">Delete School</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
