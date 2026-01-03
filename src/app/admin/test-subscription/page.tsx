"use client";

import { useState } from "react";

export default function TestSubscriptionPage() {
  const [formData, setFormData] = useState({
    studentId: "9595",
    stripeSubscriptionId: "sub_1SXVX0AoqPpU95beDAInXBlH",
    stripeCustomerId: "cus_TUUVemZR6EHCXT",
    packageName: "3",
    packageDuration: "1month",
    amount: "90",
    currency: "usd",
    status: "active",
    startDate: "2025-11-25T23:20:00Z",
    endDate: "2026-02-25T23:20:00Z",
    customerEmail: "bedhanan@gmail.com"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch('/api/admin/manual-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to add subscription');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Add Test Subscription Data</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Package Name</label>
              <input
                type="text"
                value={formData.packageName}
                onChange={(e) => handleInputChange('packageName', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stripe Subscription ID</label>
            <input
              type="text"
              value={formData.stripeSubscriptionId}
              onChange={(e) => handleInputChange('stripeSubscriptionId', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stripe Customer ID</label>
            <input
              type="text"
              value={formData.stripeCustomerId}
              onChange={(e) => handleInputChange('stripeCustomerId', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate.slice(0, -1)}
                onChange={(e) => handleInputChange('startDate', e.target.value + 'Z')}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate.slice(0, -1)}
                onChange={(e) => handleInputChange('endDate', e.target.value + 'Z')}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer Email</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding Subscription...' : 'Add Test Subscription'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md text-green-700">
            ✅ Subscription added successfully! ID: {result.subscription?.id}
          </div>
        )}
      </div>
    </div>
  );
}