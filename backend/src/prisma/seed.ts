import { prisma } from './client';

async function main() {
  console.log('🌱 Starting database seeding...');

  // TODO: Implement seeding for initial roles and system administrator
  // TODO: Implement seeding for initial hospital departments and room numbers
  // TODO: Implement seeding for initial doctor profiles
  // TODO: Implement seeding for mock patients for queue testing

  console.log('✅ Seeding completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
