import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Checking quiz submissions...");
    const subs = await prisma.quizSubmission.findMany();
    console.log(subs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
