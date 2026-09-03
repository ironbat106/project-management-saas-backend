import type { Server } from "http";

import app from "./app.js";
import config from "./app/config/index.js";
import { prisma } from "./app/lib/prisma.js";
import { redisClient } from "./app/lib/redis.js";

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");


    await redisClient.connect();
    console.log("Redis connected successfully");


    server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });

  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

main();


process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection detected, shutting down:", error);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});


process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception detected, shutting down:", error);
  process.exit(1);
});