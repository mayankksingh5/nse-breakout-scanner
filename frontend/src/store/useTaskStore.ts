import { create } from 'zustand';
import type { User, Task, Priority, Status } from '@/types/task';
import * as api from '@/lib/tasksApi';

// Central store for the task app: the signed-in user, the member directory, the
// loaded task list, and the active filters. Theme is intentionally NOT here — it
// is shared with the rest of the app via useIpoStore so dark mode stays unified.

export interface TaskFilters {
  status: Status | '';
  priority: Priority | '';
  assignedTo: string; // '' = all, 'unassigned', or a user id
  search: string;
  sort: string; // updated | created | due | priority | status
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  status: '',
  priority: '',
  assignedTo: '',
  search: '',
  sort: 'updated',
};

interface TaskStoreState {
  currentUser: User | null;
  members: User[];
  tasks: Task[];
  loading: boolean;
  bootstrapped: boolean;
  error: string | null;

  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  resetFilters: () => void;

  // Shared drawer UI state (drawers are rendered once in the shell).
  formOpen: boolean;
  editingTask: Task | null;
  detailTaskId: string | null;
  openCreate: () => void;
  openEdit: (task: Task) => void;
  openDetail: (id: string) => void;
  closeDrawers: () => void;
  /** Bumped after any mutation so views know to refetch. */
  refreshSignal: number;
  bumpRefresh: () => void;

  /** Load current user + members once on entry. Returns the user (or null). */
  bootstrap: () => Promise<User | null>;
  /** Re-fetch the task list using the current filters (optionally forcing mine). */
  refreshTasks: (opts?: { mine?: boolean }) => Promise<void>;
  refreshMembers: () => Promise<void>;
  logout: () => Promise<void>;

  /** Lookup helper for rendering names from ids. */
  memberName: (id: string | null) => string;
  memberById: (id: string | null) => User | undefined;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  currentUser: null,
  members: [],
  tasks: [],
  loading: false,
  bootstrapped: false,
  error: null,

  filters: DEFAULT_TASK_FILTERS,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_TASK_FILTERS }),

  formOpen: false,
  editingTask: null,
  detailTaskId: null,
  openCreate: () => set({ formOpen: true, editingTask: null }),
  openEdit: (task) => set({ formOpen: true, editingTask: task, detailTaskId: null }),
  openDetail: (id) => set({ detailTaskId: id }),
  closeDrawers: () => set({ formOpen: false, editingTask: null, detailTaskId: null }),
  refreshSignal: 0,
  bumpRefresh: () => set((s) => ({ refreshSignal: s.refreshSignal + 1 })),

  bootstrap: async () => {
    try {
      const [{ user }, members] = await Promise.all([api.fetchMe(), api.fetchUsers()]);
      set({ currentUser: user, members, bootstrapped: true });
      return user;
    } catch {
      set({ bootstrapped: true });
      return null;
    }
  },

  refreshTasks: async (opts) => {
    const { filters } = get();
    set({ loading: true, error: null });
    try {
      const tasks = await api.fetchTasks({
        status: filters.status,
        priority: filters.priority,
        assignedTo: filters.assignedTo,
        search: filters.search,
        sort: filters.sort,
        mine: opts?.mine,
      });
      set({ tasks, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load tasks' });
    }
  },

  refreshMembers: async () => {
    try {
      set({ members: await api.fetchUsers() });
    } catch {
      /* keep stale list */
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      set({ currentUser: null, tasks: [], members: [] });
    }
  },

  memberName: (id) => {
    if (!id) return 'Unassigned';
    return get().members.find((m) => m.id === id)?.name ?? 'Unknown';
  },
  memberById: (id) => (id ? get().members.find((m) => m.id === id) : undefined),
}));
