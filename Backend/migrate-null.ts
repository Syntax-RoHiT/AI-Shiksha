import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const franchiseId = 'e0d42d24-3980-4434-87e8-bc75c3bdaf6e';

  console.log(`Starting migration to franchise: ${franchiseId}`);

  // List of tables that have franchise_id
  const models = [
    'user',
    'course',
    'enrollment',
    'payment',
    'certificate',
    'category',
    'tag',
    'supportTicket',
    'announcement',
    'emailTemplate',
    'certificateTemplate',
    'courseQA',
    'razorpaySetting',
    'coupon',
    'page',
    'footerSetting',
    'studentFeedback'
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
      console.error(`Failed for ${model}: ${e.message}`);
    }
  }

  console.log("Migration completed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
