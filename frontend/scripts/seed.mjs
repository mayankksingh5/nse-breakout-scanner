// Seed the task-management database with a first admin (and a little sample
// data) so you can log in immediately. Idempotent: re-running only fills gaps.
//
//   cd frontend
//   npm install
//   npm run seed
//
// Reads MONGODB_URI / JWT vars from frontend/.env.local (or the real env).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimal .env.local loader (no dotenv dependency) ---
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'team_tasks';
const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

if (!uri) {
  console.error('✗ MONGODB_URI is not set. Add it to frontend/.env.local and retry.');
  process.exit(1);
}

const SAMPLE_MEMBERS = [
  { name: 'Priya Sharma', email: 'priya@example.com', designation: 'Frontend Engineer' },
  { name: 'Rahul Verma', email: 'rahul@example.com', designation: 'Backend Engineer' },
  { name: 'Anita Desai', email: 'anita@example.com', designation: 'Product Designer' },
];

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const tasks = db.collection('tasks');

  await users.createIndex({ email: 1 }, { unique: true });
  await tasks.createIndex({ status: 1 });
  await tasks.createIndex({ assignedTo: 1 });
  await tasks.createIndex({ updatedAt: -1 });

  const now = new Date();

  // 1. Admin
  let admin = await users.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const { insertedId } = await users.insertOne({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      designation: 'Administrator',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    admin = { _id: insertedId };
    console.log(`✓ Created admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`• Admin already exists: ${adminEmail}`);
  }

  // 2. Sample members (password = "password123")
  const memberIds = [];
  for (const m of SAMPLE_MEMBERS) {
    const existing = await users.findOne({ email: m.email });
    if (existing) {
      memberIds.push(existing._id);
      continue;
    }
    const passwordHash = await bcrypt.hash('password123', 10);
    const { insertedId } = await users.insertOne({
      ...m,
      email: m.email.toLowerCase(),
      passwordHash,
      role: 'member',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    memberIds.push(insertedId);
    console.log(`✓ Created member: ${m.email} / password123`);
  }

  // 3. Sample tasks (only when the collection is empty)
  if ((await tasks.countDocuments()) === 0) {
    const sample = [
      { title: 'Set up CI pipeline', priority: 'high', status: 'in_progress', assignedTo: memberIds[1] },
      { title: 'Design dashboard mockups', priority: 'medium', status: 'review', assignedTo: memberIds[2] },
      { title: 'Fix login redirect bug', priority: 'critical', status: 'new', assignedTo: memberIds[0] },
      { title: 'Write API documentation', priority: 'low', status: 'done', assignedTo: memberIds[1] },
    ];
    await tasks.insertMany(
      sample.map((t) => ({
        title: t.title,
        description: '',
        createdBy: admin._id,
        assignedTo: t.assignedTo ?? null,
        priority: t.priority,
        status: t.status,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      })),
    );
    console.log(`✓ Created ${sample.length} sample tasks`);
  }

  await client.close();
  console.log('\nDone. Start the app with `npm run dev` and sign in at /tasks/login.');
}

main().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
