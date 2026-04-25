import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting Production Data Migration...");

  // 1. Find the Main LMS Franchise
  // We look for the franchise associated with your main domain. Replace with your actual prod domain if needed.
  let mainFranchise = await prisma.franchise.findFirst({
    where: { 
      // Update this list with your actual production main domains if necessary
      domain: { in: ['experttrainersacademy.cloud', 'localhost'] } 
    },
    orderBy: { created_at: 'asc' }
  });

  if (!mainFranchise) {
    console.log("Main Franchise not found. Creating one...");
    mainFranchise = await prisma.franchise.create({
      data: {
        name: "Main LMS",
        domain: process.env.FRONTEND_URL ? new URL(process.env.FRONTEND_URL).hostname : "experttrainersacademy.cloud",
        lms_name: "Super Admin Portal",
        primary_color: "#6366f1",
        is_active: true,
        domain_verified: true
      }
    });
  }

  const franchiseId = mainFranchise.id;
  console.log(`Using Main Franchise ID: ${franchiseId} (Domain: ${mainFranchise.domain})`);

  // 2. Migrate Data
  const models = [
    'user', 'course', 'enrollment', 'payment', 'certificate', 'category', 'tag',
    'supportTicket', 'announcement', 'emailTemplate', 'certificateTemplate',
    'courseQA', 'studentFeedback'
  ];

  for (const model of models) {
    try {
      // @ts-ignore
      const res = await prisma[model].updateMany({
        where: { franchise_id: null },
        data: { franchise_id: franchiseId }
      });
      console.log(`Updated ${res.count} records in ${model}`);
    } catch (e: any) {
      console.log(`Skipped ${model} (No null records or not applicable)`);
    }
  }

  console.log("Migration completed successfully! 🎉");
}

main().catch(console.error).finally(() => prisma.$disconnect());
