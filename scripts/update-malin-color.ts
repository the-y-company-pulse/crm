import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({
    where: { email: "malin@ycompany.se" },
    data: { color: "#e9d7c4" }
  })
  console.log(`✓ Updated ${user.name} color to ${user.color} (beige)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
