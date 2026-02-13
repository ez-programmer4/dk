"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Loader2, School } from "lucide-react";

interface School {
  id: string;
  name: string;
  slug: string;
  domain?: string;
}

interface SchoolSelectorProps {
  onSchoolSelect?: (school: School) => void;
  redirectAfterSelect?: boolean;
}

export function SchoolSelector({ onSchoolSelect, redirectAfterSelect = true }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/schools');
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      const data = await response.json();
      setSchools(data.schools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = async (school: School) => {
    if (onSchoolSelect) {
      onSchoolSelect(school);
    }

    if (redirectAfterSelect) {
      try {
        // First, inform the server about the school selection
        await fetch('/api/user/select-school', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolId: school.id })
        });

        // Then redirect to the appropriate dashboard
        // We need to determine the user role - let's check the session
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user?.role) {
          const role = session.user.role;
          let redirectUrl = '';

          switch (role) {
            case 'admin':
              redirectUrl = `/admin/${school.slug}`;
              break;
            case 'teacher':
              redirectUrl = `/${school.slug}/teachers/dashboard`;
              break;
            case 'controller':
              redirectUrl = `/controller/${school.slug}/dashboard`;
              break;
            case 'registral':
              redirectUrl = `/registral/${school.slug}/dashboard`;
              break;
            case 'superAdmin':
              redirectUrl = `/super-admin/dashboard`;
              break;
            default:
              redirectUrl = '/login';
          }

          router.push(redirectUrl);
        } else {
          // Fallback to admin dashboard
          router.push(`/admin/${school.slug}`);
        }
      } catch (error) {
        console.error('Error selecting school:', error);
        // Still redirect even if the API call fails
        router.push(`/admin/${school.slug}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSchools} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Schools Available</CardTitle>
            <CardDescription>
              You don't have access to any schools. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (schools.length === 1) {
    // Auto-select if only one school
    const school = schools[0];
    handleSchoolSelect(school);
    return null; // Component will unmount after redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <School className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Select Your School</CardTitle>
          <CardDescription>
            Choose the school you want to access from the available options below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {schools.map((school) => (
              <Button
                key={school.id}
                onClick={() => handleSchoolSelect(school)}
                variant="outline"
                className="h-auto p-4 justify-start hover:bg-blue-50 hover:border-blue-200"
              >
                <div className="text-left">
                  <div className="font-medium">{school.name}</div>
                  <div className="text-sm text-gray-500">/{school.slug}</div>
                  {school.domain && (
                    <div className="text-xs text-gray-400">{school.domain}</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
