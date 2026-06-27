'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  ShieldCheck,
  UserPlus,
  GripVertical,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import {
  createUser,
  updateUser,
  deleteUser,
  setUserActive,
  reorderUsers,
} from '@/lib/tasksApi';
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
  const bumpRefresh = useTaskStore((s) => s.bumpRefresh);
  const pushToast = useTaskStore((s) => s.pushToast);

  // Local mirror so drag-reordering feels instant before it persists.
  const [rows, setRows] = useState<User[]>([]);

  // Edit/create drawer state.
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state.
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  // Drag state.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  useEffect(() => {
    setRows(members);
  }, [members]);

  if (bootstrapped && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        You need an admin account to manage team members.
      </div>
    );
  }

  // ---- Create / edit ----
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
          email,
          role,
          designation,
          ...(password ? { password } : {}),
        });
        pushToast('success', `${name} updated`);
      } else {
        await createUser({ name, email, password, role, designation });
        pushToast('success', `${name} added`);
      }
      await refreshMembers();
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save member';
      setError(msg);
      pushToast('error', msg);
    } finally {
      setSaving(false);
    }
  }

  // ---- Activate / deactivate ----
  async function toggleActive(m: User) {
    try {
      await setUserActive(m.id, !m.active);
      pushToast('success', `${m.name} ${m.active ? 'deactivated' : 'activated'}`);
      await refreshMembers();
    } catch (e) {
      pushToast('error', e instanceof Error ? e.message : 'Failed to update member');
    }
  }

  // ---- Delete ----
  function startDelete(m: User) {
    setDeleteTarget(m);
    setReassignTo('');
  }

  async function confirmDelete(mode: 'reassign' | 'only') {
    if (!deleteTarget) return;
    if (mode === 'reassign' && !reassignTo) {
      pushToast('error', 'Pick a member to reassign tasks to');
      return;
    }
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id, mode === 'reassign' ? reassignTo : null);
      pushToast('success', `${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      await refreshMembers();
      bumpRefresh(); // task views may have had reassignments/unassignments
    } catch (e) {
      pushToast('error', e instanceof Error ? e.message : 'Failed to delete member');
    } finally {
      setDeleting(false);
    }
  }

  // ---- Drag to reorder ----
  function onDrop(index: number) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === index) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setRows(next); // optimistic
    reorderUsers(next.map((u) => u.id))
      .then(() => {
        pushToast('success', 'Order saved');
        refreshMembers();
      })
      .catch((e) => {
        pushToast('error', e instanceof Error ? e.message : 'Failed to save order');
        setRows(members); // revert
      });
  }

  const canDelete = (m: User) =>
    currentUser && m.id !== currentUser.id && m.role !== 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Team Members</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag the handle to reorder. Admins can edit, deactivate, or delete members.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" /> Add member
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Tasks</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((m, index) => (
              <tr
                key={m.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={() => onDrop(index)}
                className={
                  'bg-white transition dark:bg-slate-950 ' +
                  (overIndex === index && dragIndex !== null
                    ? 'border-t-2 border-emerald-400'
                    : '')
                }
              >
                <td className="px-2 py-3">
                  <span
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    title="Drag to reorder"
                    className="flex h-6 w-6 cursor-grab items-center justify-center text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:hover:text-slate-200"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                </td>
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
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.assignedCount ?? 0}</td>
                <td className="px-4 py-3">
                  {m.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {m.id !== currentUser?.id && (
                      <button
                        onClick={() => toggleActive(m)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {m.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {canDelete(m) && (
                      <button
                        onClick={() => startDelete(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Create / edit drawer ---- */}
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
              placeholder="name@company.com"
              className={fieldClass}
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

      {/* ---- Delete confirmation dialog ---- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-base font-semibold">Delete {deleteTarget.name}?</h2>
            </div>

            {(deleteTarget.assignedCount ?? 0) > 0 ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  This member has <strong>{deleteTarget.assignedCount}</strong> assigned task
                  {deleteTarget.assignedCount === 1 ? '' : 's'}. Choose what to do with them:
                </p>
                <div className="mt-4">
                  <label className={labelClass}>Reassign tasks to</label>
                  <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className={fieldClass}>
                    <option value="">— select a member —</option>
                    {members
                      .filter((u) => u.id !== deleteTarget.id && u.active)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} · {u.designation}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => confirmDelete('reassign')}
                    disabled={deleting}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Reassign tasks &amp; delete
                  </button>
                  <button
                    onClick={() => confirmDelete('only')}
                    disabled={deleting}
                    className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    Delete member only (tasks become unassigned)
                  </button>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  This permanently removes the member. This action cannot be undone.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmDelete('only')}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
