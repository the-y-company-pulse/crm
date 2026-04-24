import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up Malin with password...")

  const hashedPassword = await bcrypt.hash("Mandelande!2", 10)

  const user = await prisma.user.update({
    where: { email: "malin@ycompany.se" },
    data: {
      hashedPassword,
      role: "user",
    },
  })

  console.log(`✓ ${user.name} (${user.email}) is now set up with password`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
