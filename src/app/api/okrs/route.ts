import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, type, cycleId, departmentId, parentObjectiveId, keyResults } = body;

  const objective = await prisma.objective.create({
    data: {
      title,
      description: description || null,
      type,
      ownerId: session.user.id,
      cycleId,
      departmentId: departmentId || null,
      parentObjectiveId: parentObjectiveId || null,
      keyResults: {
        create: keyResults.map((kr: { title: string; targetValue: number; unit: string }) => ({
          title: kr.title,
          targetValue: kr.targetValue,
          unit: kr.unit,
        })),
      },
    },
    include: { keyResults: true },
  });

  return NextResponse.json(objective, { status: 201 });
}
