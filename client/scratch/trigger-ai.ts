import { processLocalQueue } from "../lib/detection/detector";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("--- STARTING AI WORKER ---");
  try {
    await processLocalQueue();
    console.log("--- AI WORKER CYCLE COMPLETED ---");
  } catch (err) {
    console.error("AI Worker failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
