import { env } from "./config/env.js";
import { connectDb } from "./data/db.js";
import app from "./app.js";

async function startServer() {
  await connectDb();

  app.listen(env.port, () => {
    console.log(`Hometown Hub API running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Hometown Hub API", error);
  process.exit(1);
});
