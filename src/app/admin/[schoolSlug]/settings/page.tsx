"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FileText, UserCog, Wallet } from "lucide-react";

interface SettingCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

function SettingCard({
  title,
  description,
  href,
  icon: Icon,
}: SettingCardProps) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer hover:border-blue-100 transition-colors group"
      onClick={() => router.push(href)}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="bg-blue-600/10 p-3 rounded-md">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </CardHeader>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const settings = [
    {
      title: "General Settings",
      description: "Manage system-wide key-value configurations.",
      href: `/admin/${schoolSlug}/settings/general`,
      icon: UserCog,
    },
    // Add other settings pages here as they are created
    // {
    //   title: "Payment Settings",
    //   description: "Configure payment gateways and fee structures.",
    //   href: "/admin/settings/payments",
    //   icon: Wallet,
    // },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header with School Branding */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 lg:p-10">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-indigo-50/30 rounded-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+PC9zdmc+')] opacity-30" />

          <div className="relative flex flex-col space-y-1">
            {/* Status & School Info */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Online
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                School: {schoolSlug}
              </span>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Manage and configure all aspects of the {schoolSlug} institution system
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting) => (
            <SettingCard key={setting.title} {...setting} />
          ))}
        </div>
      </div>
    </div>
  );
}
