import bcrypt from "bcryptjs";
import config from "../config/index.js";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
 
async function seedAdmin() {
  const existingAdmin = await prisma.user.findUnique({ where: { email: config.admin_email } });
 
  if (existingAdmin) {
    console.log("ℹ️  Admin account already exists. Skipping seed.");
    return;
  }
 
  const hashedPassword = await bcrypt.hash(config.admin_password, Number(config.bcrypt_salt_rounds));
 
  await prisma.user.create({
    data: {
      name: config.admin_name,
      email: config.admin_email,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
 
  console.log("✅ Admin account created successfully:", config.admin_email);
}
 
seedAdmin()
  .catch((error) => {
    console.error("❌ Failed to seed admin account:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
