import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Cached MongoClient. On Vercel/serverless the module is re-used across warm
// invocations, so we stash the client+promise on the global object to avoid
// opening a new connection (and exhausting Atlas connections) on every request.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'team_tasks';

interface MongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

const globalForMongo = globalThis as unknown as { _mongo?: MongoCache };
const cache: MongoCache = globalForMongo._mongo ?? { client: null, promise: null };
globalForMongo._mongo = cache;

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy frontend/.env.example to .env.local and add your Atlas connection string.',
    );
  }
  if (!cache.client) {
    if (!cache.promise) {
      cache.promise = new MongoClient(uri).connect();
    }
    cache.client = await cache.promise;
  }
  return cache.client.db(dbName);
}

// --- Document shapes (stored form, with ObjectIds) ---

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  designation: string;
  active: boolean;
  /** Manual display order on the Members page (lower = first). */
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDoc {
  _id?: ObjectId;
  title: string;
  description: string;
  createdBy: ObjectId | null;
  assignedTo: ObjectId | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'review' | 'done' | 'closed';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDoc {
  _id?: ObjectId;
  taskId: ObjectId;
  authorId: ObjectId | null;
  body: string;
  createdAt: Date;
}

export interface AuditDoc {
  _id?: ObjectId;
  taskId: ObjectId;
  actorId: ObjectId | null;
  action: 'created' | 'updated' | 'deleted';
  changes: { field: string; from: unknown; to: unknown }[];
  createdAt: Date;
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>('users');
}
export async function tasks(): Promise<Collection<TaskDoc>> {
  return (await getDb()).collection<TaskDoc>('tasks');
}
export async function comments(): Promise<Collection<CommentDoc>> {
  return (await getDb()).collection<CommentDoc>('comments');
}
export async function auditlogs(): Promise<Collection<AuditDoc>> {
  return (await getDb()).collection<AuditDoc>('auditlogs');
}

/** Parse a string into an ObjectId, returning null when invalid. */
export function toObjectId(id: string | null | undefined): ObjectId | null {
  if (id && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

export { ObjectId };
