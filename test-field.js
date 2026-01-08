const { PrismaClient } = require('@prisma/client');

async function testField() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing createdById field...');
    console.log('Available School fields with "created" or "By":',
      Object.keys(prisma.school.fields).filter(f =>
        f.includes('created') || f.includes('By')
      )
    );

    console.log('All School fields:', Object.keys(prisma.school.fields));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testField();






