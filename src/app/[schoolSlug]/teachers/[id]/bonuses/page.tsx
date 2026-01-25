"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiAward, FiPlus, FiCalendar, FiDollarSign } from "react-icons/fi";

interface Bonus {
  id: string;
  amount: number;
  reason: string;
  period: string;
  awardedAt: string;
  awardedBy: string;
}

export default function TeacherBonusesPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const teacherId = params.id as string;

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBonuses();
  }, [teacherId, schoolSlug]);

  async function fetchBonuses() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/${schoolSlug}/teachers/${teacherId}/bonuses`);
      if (!response.ok) throw new Error("Failed to fetch bonuses");
      const data = await response.json();
      setBonuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bonuses");
    } finally {
      setLoading(false);
    }
  }

  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Bonuses</h1>
          <p className="text-gray-600">Performance bonuses and awards</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Total Bonuses</h3>
              <p className="text-3xl font-bold">${totalBonuses.toLocaleString()}</p>
            </div>
            <FiAward className="w-12 h-12 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-red-500">⚠️</div>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Bonuses List */}
      <div className="space-y-4">
        {bonuses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FiAward className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bonuses Yet</h3>
              <p className="text-gray-600">This teacher hasn't received any bonuses.</p>
            </CardContent>
          </Card>
        ) : (
          bonuses.map((bonus) => (
            <Card key={bonus.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <FiAward className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">${bonus.amount.toLocaleString()}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <FiCalendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{bonus.period}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Bonus
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Reason: </span>
                    <span className="text-sm text-gray-600">{bonus.reason}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Awarded by: </span>
                    <span className="text-sm text-gray-600">{bonus.awardedBy}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Date: </span>
                    <span className="text-sm text-gray-600">
                      {new Date(bonus.awardedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      {bonuses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bonuses</p>
                  <p className="text-2xl font-bold text-gray-900">{bonuses.length}</p>
                </div>
                <FiAward className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Bonus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.round(totalBonuses / bonuses.length).toLocaleString()}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Latest Bonus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bonuses.length > 0 ? `$${bonuses[0].amount.toLocaleString()}` : "$0"}
                  </p>
                </div>
                <FiCalendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}













