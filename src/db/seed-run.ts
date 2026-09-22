import "dotenv/config";
import { pool } from "./index";
import { seedDatabase } from "./seed";

async function main() {
  const force = process.argv.includes("--force");
  const result = await seedDatabase(force);
  console.log("[seed]", JSON.stringify(result));
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
