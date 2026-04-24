import { prisma } from "@/lib/prisma";
import Kanban from "@/components/Kanban";
import TopNav from "@/components/TopNav";
import type { Deal, Stage, User } from "@/lib/types";
import { auth } from "../../auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [deals, stages, users] = await Promise.all([
    prisma.deal.findMany({
      include: {
        owner: true,
        activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Serialize Date → string for client component
  const serialize = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

  const isAdmin = session.user.role === "admin";

  return (
    <main className="min-h-screen">
      <TopNav currentTab="pipeline" isAdmin={isAdmin} />
      <Kanban
        initialDeals={serialize(deals) as unknown as Deal[]}
        stages={serialize(stages) as unknown as Stage[]}
        users={serialize(users) as unknown as User[]}
        currentUserId={session.user.id}
      />
    </main>
  );
}
