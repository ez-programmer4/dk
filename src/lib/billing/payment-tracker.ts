import { prisma } from "@/lib/prisma";

export interface PaymentRecord {
  id: string;
  schoolId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class PaymentTracker {
  /**
   * Record a new payment
   */
  static async recordPayment(data: {
    schoolId: string;
    amount: number;
    currency: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    paymentMethod?: string;
    transactionId?: string;
    notes?: string;
  }): Promise<PaymentRecord> {
    try {
      // Create payment record (assuming we add a payments table)
      // For now, we'll use audit logs to track payments
      const payment = await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: (await prisma.superAdmin.findFirst())?.id || "system", // Use first super admin or system
          action: "school_payment",
          resourceType: "payment",
          resourceId: data.schoolId,
          details: {
            amount: data.amount,
            currency: data.currency,
            billingPeriodStart: data.billingPeriodStart,
            billingPeriodEnd: data.billingPeriodEnd,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId,
            notes: data.notes,
            status: "completed",
          },
          ipAddress: "system",
          userAgent: "payment-system",
        },
      });

      return {
        id: payment.id,
        schoolId: data.schoolId,
        amount: data.amount,
        currency: data.currency,
        status: "completed",
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        notes: data.notes,
        createdAt: payment.createdAt,
        processedAt: payment.createdAt,
      };
    } catch (error) {
      console.error("Error recording payment:", error);
      throw new Error("Failed to record payment");
    }
  }

  /**
   * Get payment history for a school
   */
  static async getSchoolPaymentHistory(schoolId: string): Promise<PaymentRecord[]> {
    try {
      const payments = await prisma.superAdminAuditLog.findMany({
        where: {
          action: "school_payment",
          resourceId: schoolId,
          resourceType: "payment",
        },
        orderBy: { createdAt: "desc" },
      });

      return payments.map(payment => ({
        id: payment.id,
        schoolId: payment.resourceId,
        amount: payment.details?.amount || 0,
        currency: payment.details?.currency || "ETB",
        status: payment.details?.status || "completed",
        billingPeriodStart: payment.details?.billingPeriodStart ? new Date(payment.details.billingPeriodStart) : payment.createdAt,
        billingPeriodEnd: payment.details?.billingPeriodEnd ? new Date(payment.details.billingPeriodEnd) : payment.createdAt,
        paymentMethod: payment.details?.paymentMethod,
        transactionId: payment.details?.transactionId,
        notes: payment.details?.notes,
        createdAt: payment.createdAt,
        processedAt: payment.createdAt,
      }));
    } catch (error) {
      console.error("Error getting payment history:", error);
      return [];
    }
  }

  /**
   * Get all payment records (for admin overview)
   */
  static async getAllPayments(): Promise<PaymentRecord[]> {
    try {
      const payments = await prisma.superAdminAuditLog.findMany({
        where: {
          action: "school_payment",
          resourceType: "payment",
        },
        include: {
          superAdmin: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return payments.map(payment => ({
        id: payment.id,
        schoolId: payment.resourceId,
        amount: payment.details?.amount || 0,
        currency: payment.details?.currency || "ETB",
        status: payment.details?.status || "completed",
        billingPeriodStart: payment.details?.billingPeriodStart ? new Date(payment.details.billingPeriodStart) : payment.createdAt,
        billingPeriodEnd: payment.details?.billingPeriodEnd ? new Date(payment.details.billingPeriodEnd) : payment.createdAt,
        paymentMethod: payment.details?.paymentMethod,
        transactionId: payment.details?.transactionId,
        notes: payment.details?.notes,
        createdAt: payment.createdAt,
        processedAt: payment.createdAt,
      }));
    } catch (error) {
      console.error("Error getting all payments:", error);
      return [];
    }
  }

  /**
   * Process a payment (mark as completed)
   */
  static async processPayment(paymentId: string, transactionId?: string): Promise<boolean> {
    try {
      await prisma.superAdminAuditLog.update({
        where: { id: paymentId },
        data: {
          details: {
            status: "completed",
            processedAt: new Date(),
            transactionId,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      return false;
    }
  }
}
