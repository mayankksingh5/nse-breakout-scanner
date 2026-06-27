import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight diagnostics for the task system on the deployed environment.
// Returns ONLY booleans/status — never secret values — so it is safe to hit
// publicly while debugging a misconfigured deployment (e.g. missing env vars
// or Atlas network access). Tells you exactly which piece is failing.
export async function GET() {
  const jwt = process.env.JWT_SECRET ?? '';
  const result: Record<string, unknown> = {
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: jwt.length >= 16,
    jwtSecretLength: jwt.length,
    db: process.env.MONGODB_DB || 'team_tasks',
    mongo: 'unknown',
  };

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const users = await db.collection('users').countDocuments();
    const admins = await db.collection('users').countDocuments({ role: 'admin' });
    result.mongo = 'ok';
    result.userCount = users;
    result.adminCount = admins;
  } catch (e) {
    result.mongo = 'error';
    // Error name + first line only, with any connection string redacted so
    // credentials/host can never leak through this public endpoint.
    const raw = e instanceof Error ? `${e.name}: ${e.message.split('\n')[0]}` : 'unknown';
    result.mongoError = raw.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://<redacted>');
  }

  return NextResponse.json(result);
}
