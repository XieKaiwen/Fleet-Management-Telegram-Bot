import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if database already has data
    const vehicleCount = await prisma.vehicles.count();
    const chargerCount = await prisma.chargers.count();

    if (vehicleCount > 0 || chargerCount > 0) {
      console.log(`Database already has data (${vehicleCount} vehicles, ${chargerCount} chargers). Skipping seed.`);
      return;
    }

    console.log("Database is empty. Running seed...");

    // Get the directory of this script
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const seedScript = join(__dirname, "seed.js");

    // Run the seed script
    const seedProcess = spawn("node", [seedScript], {
      stdio: "inherit",
      shell: true,
    });

    // Wait for seed to complete
    await new Promise((resolve, reject) => {
      seedProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Seed process exited with code ${code}`));
        }
      });
    });

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error in conditional seed:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
