"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface SchoolCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface NewSchool {
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
  adminEmail: string;
  adminPhone: string;
}

const initialSchoolState: NewSchool = {
  name: "",
  email: "",
  phone: "",
  address: "",
  slug: "",
  adminName: "",
  adminUsername: "",
  adminPassword: "",
  adminConfirmPassword: "",
  adminEmail: "",
  adminPhone: "",
};

export function SchoolCreationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: SchoolCreationModalProps) {
  const [newSchool, setNewSchool] = useState<NewSchool>(initialSchoolState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSchool({ ...newSchool, name, slug });
    checkSlugAvailability(slug);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const response = await fetch(`/api/super-admin/schools/check-slug?slug=${slug}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchool),
      });

      if (response.ok) {
        setNewSchool(initialSchoolState);
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create school");
      }
    } catch (error) {
      setError("An error occurred while creating the school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create School
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Create New School
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">School Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  value={newSchool.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter school name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">School Slug *</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    value={newSchool.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setNewSchool({ ...newSchool, slug });
                      checkSlugAvailability(slug);
                    }}
                    placeholder="school-slug"
                    required
                  />
                  {slugChecking && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                  {slugAvailable !== null && !slugChecking && (
                    <div className="absolute right-3 top-3">
                      {slugAvailable ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {slugAvailable === false && (
                  <p className="text-sm text-red-500 mt-1">This slug is already taken</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSchool.email}
                  onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                  placeholder="school@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newSchool.phone}
                  onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                  placeholder="+251..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newSchool.address}
                onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                placeholder="School address"
                rows={2}
              />
            </div>
          </div>

          {/* Admin Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Administrator Account</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminName">Admin Name</Label>
                <Input
                  id="adminName"
                  value={newSchool.adminName}
                  onChange={(e) => setNewSchool({ ...newSchool, adminName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newSchool.adminEmail}
                  onChange={(e) => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                  placeholder="admin@school.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminUsername">Username</Label>
                <Input
                  id="adminUsername"
                  value={newSchool.adminUsername}
                  onChange={(e) => setNewSchool({ ...newSchool, adminUsername: e.target.value })}
                  placeholder="admin_username"
                />
              </div>

              <div>
                <Label htmlFor="adminPhone">Phone</Label>
                <Input
                  id="adminPhone"
                  value={newSchool.adminPhone}
                  onChange={(e) => setNewSchool({ ...newSchool, adminPhone: e.target.value })}
                  placeholder="+251..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={newSchool.adminPassword}
                  onChange={(e) => setNewSchool({ ...newSchool, adminPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                <Input
                  id="adminConfirmPassword"
                  type="password"
                  value={newSchool.adminConfirmPassword}
                  onChange={(e) => setNewSchool({ ...newSchool, adminConfirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || slugAvailable === false}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create School
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
