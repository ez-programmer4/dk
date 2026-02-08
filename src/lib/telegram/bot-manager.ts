import { getGlobalBotToken } from "@/lib/bot-token";
import { prisma } from "@/lib/prisma";

export class CentralizedBotManager {
  private botToken: string | null = null;

  constructor() {
    this.initializeBotToken();
  }

  private async initializeBotToken() {
    this.botToken = await getGlobalBotToken();
  }

  /**
   * Get the global bot token
   */
  public async getBotToken(): Promise<string | null> {
    if (!this.botToken) {
      await this.initializeBotToken();
    }
    return this.botToken;
  }

  /**
   * Find user by Telegram ID across all schools
   */
  public async findUserByTelegramId(telegramId: number) {
    try {
      // Check admin table
      const admin = await prisma.admin.findFirst({
        where: { chat_id: telegramId.toString() },
        include: { school: true },
      });

      if (admin) {
        return {
          type: 'admin',
          user: admin,
          school: admin.school,
        };
      }

      // Check teacher table
      const teacher = await prisma.wpos_wpdatatable_24.findFirst({
        where: { chat_id: telegramId.toString() },
        include: { school: true },
      });

      if (teacher) {
        return {
          type: 'teacher',
          user: teacher,
          school: teacher.school,
        };
      }

      // Check student table
      const student = await prisma.wpos_wpdatatable_23.findFirst({
        where: { chatId: telegramId.toString() },
        include: { school: true },
      });

      if (student) {
        return {
          type: 'student',
          user: student,
          school: student.school,
        };
      }

      // Check controller table
      const controller = await prisma.wpos_wpdatatable_28.findFirst({
        where: { chat_id: telegramId.toString() },
        include: { school: true },
      });

      if (controller) {
        return {
          type: 'controller',
          user: controller,
          school: controller.school,
        };
      }

      // Check registral table
      const registral = await prisma.wpos_wpdatatable_33.findFirst({
        where: { chat_id: telegramId.toString() },
        include: { school: true },
      });

      if (registral) {
        return {
          type: 'registral',
          user: registral,
          school: registral.school,
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding user by Telegram ID:', error);
      return null;
    }
  }

  /**
   * Show user interface based on role
   */
  public async showUserInterface(telegramId: number, chatId: number) {
    const userData = await this.findUserByTelegramId(telegramId);

    if (!userData) {
      return this.showRegistrationInterface(chatId);
    }

    switch (userData.type) {
      case 'admin':
        return this.showAdminInterface(userData.user, userData.school, chatId);
      case 'teacher':
        return this.showTeacherInterface(userData.user, userData.school, chatId);
      case 'student':
        return this.showStudentInterface(userData.user, userData.school, chatId);
      case 'controller':
        return this.showControllerInterface(userData.user, userData.school, chatId);
      case 'registral':
        return this.showRegistralInterface(userData.user, userData.school, chatId);
      default:
        return this.showRegistrationInterface(chatId);
    }
  }

  /**
   * Show admin interface
   */
  private showAdminInterface(admin: any, school: any, chatId: number) {
    // Return admin-specific interface options
    return {
      text: `Welcome ${admin.name}!\n\nSchool: ${school.name}\nRole: Administrator\n\nChoose an option:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📊 Dashboard", callback_data: "admin_dashboard" },
            { text: "👥 Users", callback_data: "admin_users" }
          ],
          [
            { text: "📚 Classes", callback_data: "admin_classes" },
            { text: "📋 Reports", callback_data: "admin_reports" }
          ],
          [
            { text: "⚙️ Settings", callback_data: "admin_settings" }
          ]
        ]
      }
    };
  }

  /**
   * Show teacher interface
   */
  private showTeacherInterface(teacher: any, school: any, chatId: number) {
    return {
      text: `Welcome ${teacher.ustazname}!\n\nSchool: ${school.name}\nRole: Teacher\n\nChoose an option:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📅 Schedule", callback_data: "teacher_schedule" },
            { text: "📝 Attendance", callback_data: "teacher_attendance" }
          ],
          [
            { text: "👨‍🎓 Students", callback_data: "teacher_students" },
            { text: "📊 Reports", callback_data: "teacher_reports" }
          ]
        ]
      }
    };
  }

  /**
   * Show student interface
   */
  private showStudentInterface(student: any, school: any, chatId: number) {
    return {
      text: `Welcome ${student.name}!\n\nSchool: ${school.name}\nRole: Student\n\nChoose an option:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📚 My Classes", callback_data: "student_classes" },
            { text: "📊 Progress", callback_data: "student_progress" }
          ],
          [
            { text: "📅 Schedule", callback_data: "student_schedule" },
            { text: "📋 Assignments", callback_data: "student_assignments" }
          ]
        ]
      }
    };
  }

  /**
   * Show controller interface
   */
  private showControllerInterface(controller: any, school: any, chatId: number) {
    return {
      text: `Welcome ${controller.name}!\n\nSchool: ${school.name}\nRole: Controller\n\nChoose an option:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💰 Earnings", callback_data: "controller_earnings" },
            { text: "📊 Reports", callback_data: "controller_reports" }
          ]
        ]
      }
    };
  }

  /**
   * Show registral interface
   */
  private showRegistralInterface(registral: any, school: any, chatId: number) {
    return {
      text: `Welcome ${registral.name}!\n\nSchool: ${school.name}\nRole: Registral\n\nChoose an option:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📝 Registrations", callback_data: "registral_registrations" },
            { text: "📋 Records", callback_data: "registral_records" }
          ]
        ]
      }
    };
  }

  /**
   * Show registration interface for unknown users
   */
  private showRegistrationInterface(chatId: number) {
    return {
      text: "Welcome to Darul Kubra!\n\nI don't recognize you yet. Please contact your school administrator to link your account.\n\nUse /start to begin setup.",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔗 Link Account", callback_data: "link_account" }
          ]
        ]
      }
    };
  }

  /**
   * Send Zoom link notification to student
   */
  public async sendZoomLinkToStudent(studentId: string, zoomLink: string, className: string) {
    try {
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: parseInt(studentId) },
        include: { school: true },
      });

      if (!student || !student.chatId) {
        console.log('Student not found or no Telegram chat ID');
        return false;
      }

      const botToken = await this.getBotToken();
      if (!botToken) {
        console.error('No global bot token configured');
        return false;
      }

      const message = `📅 New Zoom Class Available!\n\nClass: ${className}\nZoom Link: ${zoomLink}\n\nJoin on time! 📚`;

      // Send message via Telegram API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: student.chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error sending Zoom link to student:', error);
      return false;
    }
  }

  /**
   * Handle callback queries from inline keyboards
   */
  public async handleCallback(callbackData: string, telegramId: number, chatId: number) {
    const userData = await this.findUserByTelegramId(telegramId);

    if (!userData) {
      return { text: "User not found. Please contact administrator." };
    }

    // Handle different callback actions based on user role and callback data
    switch (callbackData) {
      case 'admin_dashboard':
        return {
          text: "📊 Admin Dashboard\n\nHere you can manage your school settings and view reports.",
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back_to_main" }]]
          }
        };

      case 'teacher_schedule':
        return {
          text: "📅 Your Teaching Schedule\n\nCheck your classes and timings.",
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back_to_main" }]]
          }
        };

      case 'student_classes':
        return {
          text: "📚 Your Classes\n\nView your enrolled classes and progress.",
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back_to_main" }]]
          }
        };

      case 'back_to_main':
        return this.showUserInterface(telegramId, chatId);

      default:
        return { text: "Unknown action. Please try again." };
    }
  }
}

// Singleton instance
let botManagerInstance: CentralizedBotManager | null = null;

export function getBotManager(): CentralizedBotManager {
  if (!botManagerInstance) {
    botManagerInstance = new CentralizedBotManager();
  }
  return botManagerInstance;
}













