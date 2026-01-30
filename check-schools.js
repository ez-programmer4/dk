const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchools() {
  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, slug: true },
      take: 5
    });

    console.log('Available schools:');
    schools.forEach(school => {
      console.log(`- ${school.name} (${school.id}) - ${school.slug}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchools();
