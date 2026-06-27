'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ListTodo, Loader2, Timer, Eye, CheckCircle2, Plus } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchDashboard } from '@/lib/tasksApi';
import { Card, CardBody, SectionTitle } from '@/components/ui/Card';
import { StatusBadge, PriorityBadge } from '@/components/tasks/badges';
import { formatDateTime } from '@/lib/taskFormat';
import type { DashboardStats } from '@/types/task';

export default function DashboardPage() {
  const refreshSignal = useTaskStore((s) => s.refreshSignal);
  const openDetail = useTaskStore((s) => s.openDetail);
  const memberName = useTaskStore((s) => s.memberName);
  const openCreate = useTaskStore((s) => s.openCreate);
  const currentUser = useTaskStore((s) => s.currentUser);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchDashboard()
      .then((d) => active && setStats(d))
      .catch(() => active && setStats(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshSignal]);

  const tiles = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: ListTodo, tone: 'text-slate-900 dark:text-slate-100' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Timer, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'In Review', value: stats?.inReview ?? 0, icon: Eye, tone: 'text-violet-600 dark:text-violet-400' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const chartData = (stats?.byMember ?? []).map((m) => ({
    name: m.name.split(' ')[0],
    Open: m.open,
    Done: m.total - m.open,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            {currentUser ? `Welcome, ${currentUser.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Here&apos;s your team at a glance.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" /> Create Task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {tiles.map(({ label, value, icon: Icon, tone }) => (
              <Card key={label}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {label}
                    </div>
                    <div className={`mt-1 text-3xl font-bold ${tone}`}>{value}</div>
                  </div>
                  <Icon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tasks by member */}
            <Card>
              <CardBody>
                <SectionTitle className="mb-4">Tasks by Member</SectionTitle>
                {chartData.length === 0 ? (
                  <p className="text-sm text-slate-400">No tasks yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-slate-500" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-slate-500" />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                        />
                        <Bar dataKey="Open" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Done" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recently updated */}
            <Card>
              <CardBody>
                <SectionTitle className="mb-4">Recently Updated</SectionTitle>
                <div className="space-y-2">
                  {(stats?.recent ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">Nothing yet.</p>
                  )}
                  {stats?.recent.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openDetail(t.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {t.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {memberName(t.assignedTo)} · {formatDateTime(t.updatedAt)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
