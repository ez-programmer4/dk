const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['school_primary_color', 'school_secondary_color', 'school_accent_color', 'school_logo_url']
        }
      }
    });

    console.log('Found settings:', settings.length);
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value} (schoolId: ${s.schoolId})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
