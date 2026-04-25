import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const usersNull = await prisma.user.count({ where: { franchise_id: null } });
  const usersLocal = await prisma.user.count({ where: { franchise_id: 'e0d42d24-3980-4434-87e8-bc75c3bdaf6e' } });
  
  const coursesNull = await prisma.course.count({ where: { franchise_id: null } });
  const coursesLocal = await prisma.course.count({ where: { franchise_id: 'e0d42d24-3980-4434-87e8-bc75c3bdaf6e' } });

  console.log(`Users with NULL franchise_id: ${usersNull}`);
  console.log(`Users with LOCALHOST franchise_id: ${usersLocal}`);
  console.log(`Courses with NULL franchise_id: ${coursesNull}`);
  console.log(`Courses with LOCALHOST franchise_id: ${coursesLocal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
