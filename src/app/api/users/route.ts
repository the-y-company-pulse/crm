import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(users);
}
