import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up Nicklas as superadmin...")

  const hashedPassword = await bcrypt.hash("Mandelande!2", 10)

  const user = await prisma.user.update({
    where: { email: "nicklas@ycompany.se" },
    data: {
      hashedPassword,
      role: "admin",
    },
  })

  console.log(`✓ ${user.name} (${user.email}) is now an admin with password set`)
  console.log("\nYou can now login at: http://localhost:3002/login")
  console.log("Email: nicklas@ycompany.se")
  console.log("Password: Mandelande!2")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
