import { prisma } from "./prisma"

export async function getPendingEmailCount(): Promise<number> {
  return await prisma.emailLog.count({
    where: { status: "pending" },
  })
}
