import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NominateForm } from "./nominate-form";

export default async function NominatePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [activeCycles, colleagues, existingNominations] = await Promise.all([
    prisma.reviewCycle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.peerNomination.findMany({
      where: { employeeId: userId },
      select: { peerId: true, reviewCycleId: true },
    }),
  ]);

  if (activeCycles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-xl font-bold text-slate-800 mb-2">No Active Review Cycle</h1>
        <p className="text-slate-500">
          Peer nominations can only be made during an active review cycle.
        </p>
      </div>
    );
  }

  return (
    <NominateForm
      cycles={activeCycles}
      colleagues={colleagues.map((c) => ({
        ...c,
        departmentName: c.department?.name ?? "No Department",
      }))}
      existingNominations={existingNominations}
    />
  );
}
