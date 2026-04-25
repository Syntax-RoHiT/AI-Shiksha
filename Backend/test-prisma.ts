import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const franchises = await prisma.franchise.findMany();
  console.log("Existing Franchises:");
  console.log(JSON.stringify(franchises, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
