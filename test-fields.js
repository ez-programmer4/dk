const { PrismaClient } = require('@prisma/client');

async function testFields() {
  const prisma = new PrismaClient();

  try {
    console.log('School fields check:');
    console.log('createdById exists:', 'createdById' in prisma.school.fields);
    console.log('telegramBotToken exists:', 'telegramBotToken' in prisma.school.fields);

    console.log('All school fields:', Object.keys(prisma.school.fields));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFields();



