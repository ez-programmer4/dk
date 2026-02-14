import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication for dashboard API
    // For now, allow access without authentication for testing

    // Get dashboard statistics
    const [
      totalSchools,
      activeSchools,
      inactiveSchools,
      counts,
      pendingRegistrations,
      totalRevenue,
      monthlyRevenue,
      recentActivities,
    ] = await Promise.all([
      // Total schools count
      prisma.school.count(),

      // Active schools count
      prisma.school.count({
        where: { status: 'active' }
      }),

      // Inactive schools count
      prisma.school.count({
        where: { status: { in: ['inactive', 'suspended', 'expired'] } }
      }),

      // Schools with student/teacher/admin counts
      (async () => {
        const schools = await prisma.school.findMany({
          select: { id: true }
        });

        const [totalStudents, totalTeachers, totalAdmins] = await Promise.all([
          // Count active students across all schools
          prisma.wpos_wpdatatable_23.count({
            where: {
              schoolId: { in: schools.map(s => s.id) },
              AND: [
                {
                  OR: [
                    { status: null },
                    { status: { notIn: ["inactive", "Inactive", "INACTIVE", "exited", "Exited", "EXITED", "cancelled", "Cancelled", "CANCELLED"] } }
                  ]
                },
                { exitdate: null }
              ]
            }
          }),
          // Count teachers across all schools
          prisma.wpos_wpdatatable_24.count({
            where: { schoolId: { in: schools.map(s => s.id) } }
          }),
          // Count admins across all schools
          prisma.admin.count({
            where: { schoolId: { in: schools.map(s => s.id) } }
          })
        ]);

        return { totalStudents, totalTeachers, totalAdmins };
      })(),

      // Pending registrations (placeholder - no registration model found)
      Promise.resolve(0),

      // Total revenue (all time)
      prisma.schoolPayment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'paid'
        }
      }),

      // Monthly revenue (current month)
      prisma.schoolPayment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'paid',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          }
        }
      }),

      // Recent activities (last 10)
      prisma.superAdminAuditLog.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          superAdmin: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
    ]);

    // Use the counts from the Promise.all result
    const { totalStudents, totalTeachers, totalAdmins } = counts;

    // Get pending registrations details (placeholder - no registration model found)
    const pendingRegistrationsList = [];

    // Transform activities for frontend
    const transformedActivities = recentActivities.map(activity => {
      console.log('Processing activity:', activity.action, 'Details type:', typeof activity.details, 'Details:', activity.details);
      let type: 'school_created' | 'school_approved' | 'school_deactivated' | 'payment_received' | 'feature_enabled' = 'school_created';
      let title = activity.action;
      let description = '';

      // Handle details field which can be string or JSON
      if (typeof activity.details === 'string') {
        description = activity.details;
      } else if (activity.details && typeof activity.details === 'object') {
        // Format JSON object into human-readable description based on action
        const details = activity.details as any;

        switch (activity.action) {
          case 'UPDATE_BASE_SALARY':
            description = `Base salary updated from ${details.previousValue || 'N/A'} to ${details.baseSalary} ${details.currency}`;
            break;
          case 'CREATE_SCHOOL':
            description = `New school created: ${details.name || 'Unknown'}`;
            break;
          case 'UPDATE_SCHOOL':
            description = `School information updated: ${details.name || details.schoolName || 'Unknown school'}`;
            break;
          case 'DELETE_SCHOOL':
            description = `School removed: ${details.name || details.schoolName || 'Unknown school'}`;
            break;
          case 'PAYMENT_PROCESSED':
            description = `Payment processed: ${details.amount || 0} ${details.currency || 'USD'}`;
            break;
          case 'FEATURE_ENABLED':
          case 'FEATURE_DISABLED':
            description = `Premium feature ${activity.action.split('_')[1].toLowerCase()}: ${details.featureName || details.name || 'Unknown feature'}`;
            break;
          case 'USER_CREATED':
            description = `New user account created: ${details.email || 'Unknown email'}`;
            break;
          case 'USER_UPDATED':
            description = `User account updated: ${details.email || 'Unknown email'}`;
            break;
          default:
            // For unknown actions, create a generic description
            const keys = Object.keys(details);
            if (keys.length > 0) {
              description = `${activity.action.toLowerCase().replace('_', ' ')}: ${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}`;
            } else {
              description = `${activity.resourceType || 'System'} ${activity.action.toLowerCase().replace('_', ' ')}`;
            }
        }
      } else {
        description = `${activity.resourceType || 'System'} ${activity.action.toLowerCase().replace('_', ' ')}`;
      }

      console.log('Final description for', activity.action, ':', description);

      // Map super admin audit log actions to activity types
      if (activity.action.includes('SCHOOL') && activity.action.includes('CREATE')) {
        type = 'school_created';
        title = 'New School Created';
        description = 'A new school was registered in the system';
      } else if (activity.action.includes('SCHOOL') && activity.action.includes('UPDATE')) {
        type = 'school_approved';
        title = 'School Updated';
        description = 'School information was modified';
      } else if (activity.action.includes('SCHOOL') && activity.action.includes('DELETE')) {
        type = 'school_deactivated';
        title = 'School Deactivated';
        description = 'A school was deactivated from the system';
      } else if (activity.action.includes('PAYMENT')) {
        type = 'payment_received';
        title = 'Payment Processed';
        description = activity.details || 'Payment transaction was completed';
      } else if (activity.action.includes('FEATURE')) {
        type = 'feature_enabled';
        title = 'Feature Modified';
        description = activity.details || 'Premium feature was modified';
      } else if (activity.action.includes('SETTING')) {
        type = 'feature_enabled';
        title = 'Settings Updated';
        description = activity.details || 'System settings were modified';
      } else {
        type = 'school_created';
        title = activity.action;
        description = activity.details || 'System activity occurred';
      }

      return {
        id: activity.id,
        type,
        title,
        description,
        timestamp: activity.createdAt.toISOString(),
        schoolName: null, // Super admin logs don't have school context
        amount: (() => {
          // Try to extract amount from string details first
          if (typeof activity.details === 'string') {
            const match = activity.details.match(/\d+(\.\d+)?/);
            if (match) return parseFloat(match[0]);
          }

          // Try to extract amount from JSON details
          if (activity.details && typeof activity.details === 'object') {
            const details = activity.details as any;
            if (details.amount) return parseFloat(details.amount);
            if (details.baseSalary) return parseFloat(details.baseSalary);
            if (details.totalAmount) return parseFloat(details.totalAmount);
          }

          return undefined;
        })(),
        currency: 'USD',
      };
    });

    // Get system health (simplified - in real app, you'd check actual services)
    const systemHealth = {
      database: true, // You could add actual database health checks
      api: true, // You could add actual API health checks
      services: true, // You could add actual service health checks
    };

    const dashboardData = {
      success: true,
      stats: {
        totalSchools,
        activeSchools,
        inactiveSchools,
        totalStudents,
        totalTeachers,
        totalAdmins,
        pendingRegistrations,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        currency: 'USD',
        systemHealth,
      },
      recentActivities: transformedActivities,
      pendingRegistrations: pendingRegistrationsList.map(reg => ({
        id: reg.id,
        schoolName: reg.schoolName,
        email: reg.email,
        phone: reg.phone,
        requestedAt: reg.createdAt.toISOString(),
        status: reg.status,
      })),
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
