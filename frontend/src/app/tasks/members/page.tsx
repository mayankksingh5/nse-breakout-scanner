'use client';

import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, UserPlus } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { createUser, updateUser, deactivateUser } from '@/lib/tasksApi';
import { Drawer } from '@/components/tasks/Drawer';
import { Badge } from '@/components/ui/Badge';
import type { Role, User } from '@/types/task';

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400';

export default function MembersPage() {
  const currentUser = useTaskStore((s) => s.currentUser);
  const members = useTaskStore((s) => s.members);
  const bootstrapped = useTaskStore((s) => s.bootstrapped);
  const refreshMembers = useTaskStore((s) => s.refreshMembers);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  if (bootstrapped && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        You need an admin account to manage team members.
      </div>
    );
  }

  function startCreate() {
    setEditing(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('member');
    setDesignation('');
    setError(null);
    setOpen(true);
  }

  function startEdit(m: User) {
    setEditing(m);
    setName(m.name);
    setEmail(m.email);
    setPassword('');
    setRole(m.role);
    setDesignation(m.designation);
    setError(null);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateUser(editing.id, {
          name,
          role,
          designation,
          ...(password ? { password } : {}),
        });
      } else {
        await createUser({ name, email, password, role, designation });
      }
      await refreshMembers();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save member');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: User) {
    try {
      if (m.active) await deactivateUser(m.id);
      else await updateUser(m.id, { active: true });
      await refreshMembers();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Team Members</h1>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" /> Add member
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((m) => (
              <tr key={m.id} className="bg-white dark:bg-slate-950">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{m.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.email}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.designation}</td>
                <td className="px-4 py-3">
                  {m.role === 'admin' ? (
                    <Badge tone="violet">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Member</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    {m.id !== currentUser?.id && (
                      <button
                        onClick={() => toggleActive(m)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {m.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit member' : 'Add member'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create member'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!editing}
              className={`${fieldClass} disabled:opacity-60`}
            />
          </div>
          <div>
            <label className={labelClass}>{editing ? 'Reset password (optional)' : 'Password'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editing ? 'Leave blank to keep current' : 'At least 6 characters'}
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={fieldClass}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
