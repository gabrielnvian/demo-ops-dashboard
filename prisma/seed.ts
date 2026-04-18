import { PrismaClient, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

const customers = [
  "Northstar HVAC",
  "Peak Plumbing Co.",
  "Ridgeway Landscape",
  "Coastal Electric",
  "Green Valley Appliance",
  "Metro Garage Doors",
  "Sierra Roofing",
  "Summit Pest Control",
];

const titles = [
  "Replace condenser unit - main building",
  "Quarterly maintenance inspection",
  "Diagnose intermittent tripping breaker",
  "Install 3 new ceiling fixtures",
  "Emergency leak repair - kitchen",
  "Water heater replacement (50gal)",
  "Annual service contract renewal",
  "New install: backup generator",
  "Fence repair after storm",
  "Spring irrigation startup",
  "Roof inspection + 2 shingle replacement",
  "Clean gutters - full property",
];

const statuses: JobStatus[] = [
  JobStatus.PENDING, JobStatus.IN_PROGRESS, JobStatus.COMPLETED,
  JobStatus.PENDING, JobStatus.IN_PROGRESS, JobStatus.PENDING,
  JobStatus.COMPLETED, JobStatus.IN_PROGRESS, JobStatus.CANCELLED,
  JobStatus.PENDING, JobStatus.COMPLETED, JobStatus.IN_PROGRESS,
];

const notes = [
  "Customer requested morning arrival window.",
  "Gate code 4412. Dogs on property - friendly.",
  null,
  "Parts ordered; ETA 2 business days.",
  "Urgent - customer is without heat.",
  null,
  "Discuss service contract at completion.",
  null,
  "Second floor access required - lift rental.",
  "Bill against PO #11283.",
  null,
  "Send invoice to accounting@customer.com.",
];

async function main() {
  // Clear existing JobOrders so reseeds are idempotent
  await prisma.jobOrder.deleteMany();

  const now = Date.now();
  for (let i = 0; i < titles.length; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const dueInDays = Math.floor(Math.random() * 10) - 2;
    await prisma.jobOrder.create({
      data: {
        title: titles[i]!,
        customer: customers[i % customers.length]!,
        status: statuses[i]!,
        notes: notes[i] ?? null,
        createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
        dueAt: new Date(now + dueInDays * 24 * 60 * 60 * 1000),
      },
    });
  }
  const count = await prisma.jobOrder.count();
  console.log(`Seeded ${count} job orders.`);
}

main().finally(() => prisma.$disconnect());
