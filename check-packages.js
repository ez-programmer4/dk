const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPackages() {
  try {
    const packages = await prisma.premiumPackage.findMany();
    console.log('Available packages:', packages.length);
    packages.forEach(pkg => {
      console.log(`- ${pkg.name} (${pkg.id}) - ${pkg.packagePricePerStudent} ETB/student`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackages();
