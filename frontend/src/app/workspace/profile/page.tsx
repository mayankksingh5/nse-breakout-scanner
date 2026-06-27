'use client';

import Link from 'next/link';
import { ShieldCheck, Mail, Briefcase, CalendarDays, ListTodo } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/taskFormat';

export default function ProfilePage() {
  const currentUser = useTaskStore((s) => s.currentUser);
  const bootstrapped = useTaskStore((s) => s.bootstrapped);

  if (!currentUser) {
    return (
      <p className="text-sm text-slate-500">{bootstrapped ? 'Not signed in.' : 'Loading…'}</p>
    );
  }

  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rows = [
    { icon: Mail, label: 'Email', value: currentUser.email },
    { icon: Briefcase, label: 'Designation', value: currentUser.designation },
    { icon: CalendarDays, label: 'Member since', value: formatDate(currentUser.createdAt) },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {initials || '?'}
            </span>
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</div>
              <div className="mt-1">
                {currentUser.role === 'admin' ? (
                  <Badge tone="violet">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                ) : (
                  <Badge tone="neutral">Team Member</Badge>
                )}
              </div>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <dt className="w-32 text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link
              href="/workspace/my"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ListTodo className="h-4 w-4" /> View my tasks
            </Link>
            <p className="text-xs text-slate-400">
              Need to change your name, email or password? Ask a workspace admin.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
