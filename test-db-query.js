const { PrismaClient } = require('@prisma/client');

async function testDatabaseQuery() {
  const prisma = new PrismaClient();

  try {
    const school = await prisma.school.findFirst();
    console.log('✅ Database query successful');
    console.log('✅ telegramBotToken field available');
    if (school) {
      console.log('Sample school telegramBotToken:', school.telegramBotToken);
      console.log('School has telegramBotToken property:', 'telegramBotToken' in school);
    } else {
      console.log('No schools found in database');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseQuery();

