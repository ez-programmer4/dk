/**
 * Feature Registry - Defines all features in the system
 * By default, ALL features are CORE (available to everyone)
 * Premium features are dynamically selected via database
 */

export const ALL_FEATURES = {
  // Student & Teacher Management
  student_management: {
    name: 'Student Management',
    description: 'Basic student CRUD operations, enrollment, and records',
    category: 'management',
    business_value: 'high' as const,
    development_cost: 'high' as const,
  },

  teacher_management: {
    name: 'Teacher Management',
    description: 'Basic teacher profiles, assignments, and information',
    category: 'management',
    business_value: 'high' as const,
    development_cost: 'medium' as const,
  },

  // Reporting & Analytics
  basic_reporting: {
    name: 'Basic Reporting',
    description: 'Simple reports on school performance and statistics',
    category: 'analytics',
    business_value: 'medium' as const,
    development_cost: 'medium' as const,
  },

  // User Management
  user_management: {
    name: 'User Management',
    description: 'Basic user accounts, roles, and permissions',
    category: 'security',
    business_value: 'high' as const,
    development_cost: 'medium' as const,
  },

  // School Configuration
  school_settings: {
    name: 'School Settings',
    description: 'Basic school configuration and preferences',
    category: 'configuration',
    business_value: 'low' as const,
    development_cost: 'low' as const,
  },

  // Dashboard & Overview
  dashboard_basic: {
    name: 'Basic Dashboard',
    description: 'Basic school overview and key metrics',
    category: 'dashboard',
    business_value: 'medium' as const,
    development_cost: 'low' as const,
  },

  // Communication
  communication_basic: {
    name: 'Basic Communication',
    description: 'Basic messaging and notifications',
    category: 'communication',
    business_value: 'medium' as const,
    development_cost: 'low' as const,
  },

  // Potentially Premium Features (dynamically gated)
  teacher_payment: {
    name: 'Teacher Payment Management',
    description: 'Automated teacher salary calculations and payments',
    category: 'finance',
    business_value: 'high' as const,
    development_cost: 'high' as const,
  },

  student_mini_app: {
    name: 'Student Mini App Features',
    description: 'Interactive mini-app for enhanced student engagement',
    category: 'engagement',
    business_value: 'medium' as const,
    development_cost: 'medium' as const,
  },

  advanced_analytics: {
    name: 'Advanced Analytics & Reporting',
    description: 'Comprehensive analytics dashboard with custom reports',
    category: 'analytics',
    business_value: 'high' as const,
    development_cost: 'high' as const,
  },

  api_access: {
    name: 'REST API Access',
    description: 'Programmatic access to school data via REST API',
    category: 'integration',
    business_value: 'medium' as const,
    development_cost: 'medium' as const,
  },

  custom_branding: {
    name: 'Custom Branding',
    description: 'White-label the platform with school branding',
    category: 'branding',
    business_value: 'medium' as const,
    development_cost: 'low' as const,
  },
} as const;

export type FeatureCode = keyof typeof ALL_FEATURES;
