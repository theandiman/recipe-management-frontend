/**
 * CookFlow Firebase Cloud Functions
 *
 * This file contains security enforcement and backend logic for CookFlow.
 */

import { setGlobalOptions } from "firebase-functions";
import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { matchesPattern, getBaseEmail, isEmailAllowedStatic } from "./matcher.js";

setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

/**
 * Get allowed emails from environment variables
 * Format: Comma-separated list (e.g., "user1@example.com,user2@example.com")
 */
export const getAllowedEmails = (): string[] => {
  const emails = process.env.ALLOWED_EMAILS || "";
  return emails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
};

/**
 * Get allowed domains from environment variables
 * Format: Comma-separated list (e.g., "company1.com,company2.com")
 */
export const getAllowedDomains = (): string[] => {
  const domains = process.env.ALLOWED_DOMAINS || "";
  return domains
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => domain.length > 0);
};

/**
 * Checks whether an email is allowed via Firestore `allowed_users` collection.
 * Supports:
 * 1. Direct document match: `allowed_users/{email}`
 * 2. Wildcard domain document: `allowed_users/*@{domain}`
 * 3. Base email if plus-addressed: `allowed_users/{baseEmail}`
 * 4. Wildcard patterns stored with `isPattern: true` (e.g., `user+*@domain.com`, `*@domain.com`)
 */
export async function isAllowedInFirestore(email: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [, domain] = normalizedEmail.split("@");
    const baseEmail = getBaseEmail(normalizedEmail);

    // 1. Direct email lookup
    const directDoc = await db.collection("allowed_users").doc(normalizedEmail).get();
    if (directDoc.exists) {
      const data = directDoc.data();
      if (data?.revoked !== true) {
        return { allowed: true, reason: `Direct match: ${normalizedEmail}` };
      }
    }

    // 2. Wildcard domain document lookup: allowed_users/*@domain.com
    if (domain) {
      const domainDoc = await db.collection("allowed_users").doc(`*@${domain}`).get();
      if (domainDoc.exists && domainDoc.data()?.revoked !== true) {
        return { allowed: true, reason: `Domain pattern match: *@${domain}` };
      }
    }

    // 3. Base email lookup for plus-addressing (e.g., andy+test@gmail.com -> andy@gmail.com)
    if (baseEmail && baseEmail !== normalizedEmail) {
      const baseDoc = await db.collection("allowed_users").doc(baseEmail).get();
      if (baseDoc.exists && baseDoc.data()?.revoked !== true && baseDoc.data()?.allowPlus !== false) {
        return { allowed: true, reason: `Base email match with sub-addressing: ${baseEmail}` };
      }
    }

    // 4. Custom wildcard patterns (documents with isPattern: true)
    const patternSnapshot = await db
      .collection("allowed_users")
      .where("isPattern", "==", true)
      .limit(50)
      .get();

    for (const doc of patternSnapshot.docs) {
      const data = doc.data();
      if (data?.revoked === true) continue;
      const pattern = data.pattern || doc.id;
      if (matchesPattern(pattern, normalizedEmail)) {
        return { allowed: true, reason: `Pattern match: ${pattern}` };
      }
    }

    return { allowed: false };
  } catch (error) {
    logger.error("Error querying allowed_users from Firestore:", error);
    return { allowed: false, reason: "firestore-error" };
  }
}

/**
 * Records an unauthorized registration attempt into `access_requests`
 */
export async function recordAccessRequest(
  email: string,
  user: { displayName?: string | null; photoURL?: string | null }
): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await db.collection("access_requests").doc(normalizedEmail).set(
      {
        email: normalizedEmail,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        status: "pending",
        requestedAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
        attemptCount: FieldValue.increment(1),
      },
      { merge: true }
    );
    logger.info(`Access request logged for: ${normalizedEmail}`);
  } catch (error) {
    logger.error(`Failed to record access request for ${email}:`, error);
  }
}

/**
 * Core handler logic for beforeUserCreated trigger.
 */
export async function handleBeforeUserCreated(event: {
  data?: {
    email?: string;
    displayName?: string | null;
    photoURL?: string | null;
  };
}): Promise<void> {
  const user = event.data;

  if (!user) {
    logger.warn("User registration blocked: No user data");
    throw new HttpsError("invalid-argument", "Invalid user data");
  }

  // Get user's email (lowercase for comparison)
  const email = user.email?.toLowerCase();

  if (!email) {
    logger.warn("User registration blocked: No email provided");
    throw new HttpsError("invalid-argument", "Email address is required for registration");
  }

  // 1. Check static environment variables (backward compatibility fallback)
  const allowedEmails = getAllowedEmails();
  const allowedDomains = getAllowedDomains();
  if (isEmailAllowedStatic(email, allowedEmails, allowedDomains)) {
    logger.info(`User registration allowed via environment configuration: ${email}`);
    return;
  }

  // 2. Check dynamic Firestore allowlist (allowed_users collection)
  const firestoreCheck = await isAllowedInFirestore(email);
  if (firestoreCheck.allowed) {
    logger.info(`User registration allowed via Firestore (${firestoreCheck.reason}): ${email}`);
    return;
  }

  // 3. User is not allowed - record access request for administrative review
  logger.warn(`User registration blocked: ${email} not in allowed list`);
  await recordAccessRequest(email, {
    displayName: user.displayName,
    photoURL: user.photoURL,
  });

  throw new HttpsError(
    "permission-denied",
    "Registration is currently invite-only in this dev environment. Your access request has been recorded for review."
  );
}

/**
 * beforeUserCreated - Blocking function that runs before any user is created
 *
 * This function intercepts ALL registration attempts (email/password, Google OAuth, etc.)
 * and checks the dynamic Firestore allowlist and static environment variables.
 *
 * Unauthorized attempts are automatically logged in `access_requests` for admin review.
 */
export const beforecreated = beforeUserCreated(handleBeforeUserCreated);
