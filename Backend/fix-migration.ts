import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting Migration Fix...");

  // 1. Find the correct Franchise
  const correctDomain = 'iconsafetyinstitute.com';
  
  let correctFranchise = await prisma.franchise.findFirst({
    where: { domain: { contains: 'iconsafetyinstitute.com' } }
  });

  if (!correctFranchise) {
      console.log(`Franchise for ${correctDomain} not found. Creating it...`);
      correctFranchise = await prisma.franchise.create({
          data: {
              name: "Icon Safety Institute",
              domain: correctDomain,
              lms_name: "Super Admin Portal",
              is_active: true,
              domain_verified: true
          }
      });
  }

  const correctId = correctFranchise.id;
  console.log(`Correct Franchise ID: ${correctId}`);

  // 2. Find the wrong Franchise (the one my script mistakenly used)
  const wrongFranchise = await prisma.franchise.findFirst({
    where: { domain: { in: ['experttrainersacademy.cloud', 'localhost'] } },
    orderBy: { created_at: 'asc' }
  });

  if (!wrongFranchise) {
      console.log("Wrong franchise not found. Let's just update all nulls just in case.");
  } else {
      const wrongId = wrongFranchise.id;
      console.log(`Moving data from Wrong ID (${wrongId}) to Correct ID (${correctId})...`);

      const models = [
        'user', 'course', 'enrollment', 'payment', 'certificate', 'category', 'tag',
        'supportTicket', 'announcement', 'emailTemplate', 'certificateTemplate',
        'courseQA', 'studentFeedback'
      ];

      for (const model of models) {
        try {
          // @ts-ignore
          const res = await prisma[model].updateMany({
            where: { franchise_id: wrongId },
            data: { franchise_id: correctId }
          });
          console.log(`Fixed ${res.count} records in ${model}`);
        } catch (e: any) {
          // Ignore
        }
      }
  }
  
  // Also fix any remaining nulls just in case
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
        data: { franchise_id: correctId }
      });
      if (res.count > 0) {
        console.log(`Also fixed ${res.count} null records in ${model}`);
      }
    } catch (e: any) {
      // Ignore
    }
  }

  console.log("Fix completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
