import { NextRequest, NextResponse } from 'next/server';
import { tasks, users } from '@/lib/server/mongo';
import { requireAuth } from '@/lib/server/auth';
import { serializeTask } from '@/lib/server/serialize';
import type { DashboardStats } from '@/types/task';

export const runtime = 'nodejs';

// GET /api/dashboard/stats — aggregated counts for the dashboard cards plus a
// per-member breakdown and the most recently updated tasks.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const taskCol = await tasks();

  const [byStatusAgg, byMemberAgg, recentDocs, userDocs] = await Promise.all([
    taskCol.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray(),
    taskCol.aggregate<{ _id: unknown; total: number; open: number }>([
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          open: {
            $sum: { $cond: [{ $in: ['$status', ['done', 'closed']] }, 0, 1] },
          },
        },
      },
    ]).toArray(),
    taskCol.find({}).sort({ updatedAt: -1 }).limit(8).toArray(),
    (await users()).find({}).toArray(),
  ]);

  const statusCount: Record<string, number> = {};
  for (const s of byStatusAgg) statusCount[s._id] = s.count;

  const total = Object.values(statusCount).reduce((a, b) => a + b, 0);
  const pending = (statusCount.new ?? 0) + (statusCount.in_progress ?? 0);
  const inReview = statusCount.review ?? 0;
  const completed = (statusCount.done ?? 0) + (statusCount.closed ?? 0);

  const nameById = new Map(userDocs.map((u) => [u._id!.toString(), u.name]));
  const byMember: DashboardStats['byMember'] = byMemberAgg
    .map((m) => {
      const userId = m._id ? String(m._id) : null;
      return {
        userId,
        name: userId ? nameById.get(userId) ?? 'Unknown' : 'Unassigned',
        open: m.open,
        total: m.total,
      };
    })
    .sort((a, b) => b.total - a.total);

  const stats: DashboardStats = {
    total,
    pending,
    inReview,
    completed,
    byMember,
    recent: recentDocs.map(serializeTask),
  };

  return NextResponse.json(stats);
}
