const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setTestPasswords() {
  try {
    console.log('Setting test passwords...');

    // Hash the password "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update controllers
    const updatedControllers = await prisma.wpos_wpdatatable_28.updateMany({
      data: { password: hashedPassword }
    });
    console.log(`Updated ${updatedControllers.count} controllers`);

    // Update registrals
    const updatedRegistrals = await prisma.wpos_wpdatatable_33.updateMany({
      data: { password: hashedPassword }
    });
    console.log(`Updated ${updatedRegistrals.count} registrals`);

    // Update teachers
    const updatedTeachers = await prisma.wpos_wpdatatable_24.updateMany({
      data: { password: hashedPassword }
    });
    console.log(`Updated ${updatedTeachers.count} teachers`);

    // Update super admin
    const updatedSuperAdmin = await prisma.superAdmin.updateMany({
      data: { password: hashedPassword }
    });
    console.log(`Updated ${updatedSuperAdmin.count} super admins`);

    // Update admins (if they have password field)
    try {
      const updatedAdmins = await prisma.admin.updateMany({
        data: { password: hashedPassword }
      });
      console.log(`Updated ${updatedAdmins.count} admins`);
    } catch (error) {
      console.log('Admins table may not have password field');
    }

    console.log('Test password set to: password123');
    console.log('You can now login with any user using password: password123');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setTestPasswords();
