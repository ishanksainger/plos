const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if(!user) {
    console.log("No user found");
    return;
  }
  
  console.log("Found user:", user.id);
  
  try {
    const res = await prisma.responsibility.create({
      data: {
        title: "Test Responsibility",
        category: "finance",
        module: "finance",
        dueDate: new Date(),
        userId: user.id,
        amount: 100,
        recurrence: 'none'
      }
    });
    console.log("Successfully created directly via Prisma:", res);
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}
main().finally(() => prisma.$disconnect());
