import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete all records from the vehicles table
    await prisma.vehicles.deleteMany({});
    console.log("All records from the vehicles table have been deleted.");

    // Delete all records from the chargers table
    await prisma.chargers.deleteMany({});
    console.log("All records from the chargers table have been deleted.");
  } catch (error) {
    console.error("Error while deleting records:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Deletion complete.");
  })
  .catch((error) => {
    console.error("Error in main execution:", error);
  });
