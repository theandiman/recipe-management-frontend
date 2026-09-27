#!/usr/bin/env node

/**
 * CLI utility to manage the Firestore email allowlist and signup requests.
 *
 * Usage:
 *   node scripts/manage-allowlist.mjs add <email-or-pattern>
 *   node scripts/manage-allowlist.mjs remove <email-or-pattern>
 *   node scripts/manage-allowlist.mjs list
 *   node scripts/manage-allowlist.mjs requests
 *   node scripts/manage-allowlist.mjs approve <email>
 *   node scripts/manage-allowlist.mjs reject <email>
 *
 * Authentication:
 *   Uses Google Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS
 *   environment variable. Defaults project to 'recipe-mgmt-dev'.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

// Determine projectId from env or .firebaserc
let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
if (!projectId) {
  try {
    const firebasercPath = path.resolve(process.cwd(), '.firebaserc');
    if (fs.existsSync(firebasercPath)) {
      const rc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
      projectId = rc.projects?.default;
    }
  } catch {
    // ignore
  }
}
projectId = projectId || 'recipe-mgmt-dev';

if (!getApps().length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    const key = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    initializeApp({
      credential: cert(key),
      projectId,
    });
  } else {
    // Attempt ADC
    initializeApp({ projectId });
  }
}

const db = getFirestore();

function printHelp() {
  console.log(`
CookFlow Allowlist Management CLI

Usage:
  node scripts/manage-allowlist.mjs <command> [arguments]

Commands:
  list                      List all allowed emails and patterns
  add <email-or-pattern>    Allow an email (e.g. user@test.com) or wildcard pattern (*@domain.com, user+*@gmail.com)
  remove <target>           Remove an email or pattern from allowlist
  requests                  List pending signup access requests
  approve <email>           Approve an access request and add to allowlist
  reject <email>            Reject an access request
`);
}

async function listAllowed() {
  console.log(`\nFetching allowlist from Firestore (project: ${projectId})...\n`);
  const snapshot = await db.collection('allowed_users').get();
  if (snapshot.empty) {
    console.log('No allowed users or patterns found in allowed_users collection.');
    return;
  }

  const items = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      ID: doc.id,
      Type: data.isPattern ? 'Wildcard Pattern' : 'Email Address',
      AllowPlus: data.allowPlus ?? true,
      AddedBy: data.addedBy || 'N/A',
      AddedAt: data.addedAt?.toDate?.()?.toISOString() || 'N/A',
    });
  });

  console.table(items);
  console.log(`Total: ${items.length} allowlist record(s)\n`);
}

async function addAllowed(target) {
  if (!target) {
    console.error('Error: Please provide an email or wildcard pattern to add.');
    process.exit(1);
  }
  const normalized = target.trim().toLowerCase();
  const isPattern = normalized.includes('*');

  await db.collection('allowed_users').doc(normalized).set(
    {
      target: normalized,
      isPattern,
      allowPlus: true,
      addedAt: FieldValue.serverTimestamp(),
      addedBy: process.env.USER || 'admin-cli',
    },
    { merge: true }
  );

  console.log(`\nSuccessfully added to allowlist: ${normalized}`);
  console.log(`Type: ${isPattern ? 'Wildcard Pattern' : 'Exact Email'}`);
  console.log(`Plus-addressing (sub-aliases) enabled: true\n`);
}

async function removeAllowed(target) {
  if (!target) {
    console.error('Error: Please provide an email or pattern to remove.');
    process.exit(1);
  }
  const normalized = target.trim().toLowerCase();
  const ref = db.collection('allowed_users').doc(normalized);
  const doc = await ref.get();
  if (!doc.exists) {
    console.log(`Record '${normalized}' does not exist in allowed_users.`);
    return;
  }
  await ref.delete();
  console.log(`\nSuccessfully removed '${normalized}' from allowlist.\n`);
}

async function listRequests() {
  console.log(`\nFetching signup access requests from Firestore (project: ${projectId})...\n`);
  const snapshot = await db.collection('access_requests').get();
  if (snapshot.empty) {
    console.log('No access requests found.');
    return;
  }

  const items = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      Email: doc.id,
      DisplayName: data.displayName || '-',
      Status: data.status || 'pending',
      Attempts: data.attemptCount || 1,
      FirstRequested: data.requestedAt?.toDate?.()?.toISOString() || '-',
      LastAttempt: data.lastAttemptAt?.toDate?.()?.toISOString() || '-',
    });
  });

  console.table(items);
  console.log(`Total: ${items.length} access request(s)\n`);
}

async function approveRequest(email) {
  if (!email) {
    console.error('Error: Please specify the email of the request to approve.');
    process.exit(1);
  }
  const normalized = email.trim().toLowerCase();

  // 1. Add to allowed_users
  await addAllowed(normalized);

  // 2. Mark request as approved
  const reqRef = db.collection('access_requests').doc(normalized);
  const reqDoc = await reqRef.get();
  if (reqDoc.exists) {
    await reqRef.set(
      {
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: process.env.USER || 'admin-cli',
      },
      { merge: true }
    );
    console.log(`Access request for ${normalized} marked as approved.`);
  }
}

async function rejectRequest(email) {
  if (!email) {
    console.error('Error: Please specify the email of the request to reject.');
    process.exit(1);
  }
  const normalized = email.trim().toLowerCase();
  const reqRef = db.collection('access_requests').doc(normalized);
  await reqRef.set(
    {
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedBy: process.env.USER || 'admin-cli',
    },
    { merge: true }
  );
  console.log(`Access request for ${normalized} marked as rejected.`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  const arg1 = args[1];

  switch (command) {
    case 'list':
      await listAllowed();
      break;
    case 'add':
      await addAllowed(arg1);
      break;
    case 'remove':
    case 'rm':
    case 'delete':
      await removeAllowed(arg1);
      break;
    case 'requests':
    case 'reqs':
      await listRequests();
      break;
    case 'approve':
      await approveRequest(arg1);
      break;
    case 'reject':
      await rejectRequest(arg1);
      break;
    case '--help':
    case '-h':
    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error('\nError executing command:', err.message || err);
  process.exit(1);
});
