// Thin client-side wrappers around the task-management REST API. All requests
// are same-origin and rely on the httpOnly session cookie for auth.

import type {
  User,
  Task,
  Comment,
  TaskDetail,
  DashboardStats,
  Role,
  Priority,
  Status,
} from '@/types/task';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore non-JSON bodies */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---
export const login = (email: string, password: string) =>
  req<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const logout = () => req<{ ok: true }>('/api/auth/logout', { method: 'POST' });

export const fetchMe = () => req<{ user: User | null }>('/api/auth/me');

// --- Users ---
export const fetchUsers = () => req<User[]>('/api/users');

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  designation: string;
}) => req<User>('/api/users', { method: 'POST', body: JSON.stringify(input) });

export const updateUser = (
  id: string,
  input: Partial<{ name: string; role: Role; designation: string; active: boolean; password: string }>,
) => req<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const deactivateUser = (id: string) => req<User>(`/api/users/${id}`, { method: 'DELETE' });

// --- Tasks ---
export interface TaskQuery {
  status?: Status | '';
  priority?: Priority | '';
  assignedTo?: string;
  search?: string;
  sort?: string;
  mine?: boolean;
}

export function fetchTasks(query: TaskQuery = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  if (query.assignedTo) params.set('assignedTo', query.assignedTo);
  if (query.search) params.set('search', query.search);
  if (query.sort) params.set('sort', query.sort);
  if (query.mine) params.set('mine', '1');
  const qs = params.toString();
  return req<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
}

export interface TaskInput {
  title: string;
  description?: string;
  assignedTo?: string | null;
  priority?: Priority;
  status?: Status;
  dueDate?: string | null;
}

export const createTask = (input: TaskInput) =>
  req<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) });

export const updateTask = (id: string, input: Partial<TaskInput>) =>
  req<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const deleteTask = (id: string) =>
  req<{ ok: true }>(`/api/tasks/${id}`, { method: 'DELETE' });

export const fetchTaskDetail = (id: string) => req<TaskDetail>(`/api/tasks/${id}`);

export const addComment = (taskId: string, body: string) =>
  req<Comment>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

// --- Dashboard ---
export const fetchDashboard = () => req<DashboardStats>('/api/dashboard/stats');
