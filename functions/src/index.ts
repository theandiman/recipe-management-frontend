/**
 * CookFlow Firebase Cloud Functions
 * 
 * This file contains security enforcement and backend logic for CookFlow.
 */

import {setGlobalOptions} from "firebase-functions";
import {beforeUserCreated, HttpsError} from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

/**
 * Get allowed emails from environment variables
 * Format: Comma-separated list (e.g., "user1@example.com,user2@example.com")
 */
const getAllowedEmails = (): string[] => {
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
const getAllowedDomains = (): string[] => {
  const domains = process.env.ALLOWED_DOMAINS || "";
  return domains
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => domain.length > 0);
};

const ALLOWED_EMAILS = getAllowedEmails();
const ALLOWED_DOMAINS = getAllowedDomains();

/**
 * beforeUserCreated - Blocking function that runs before any user is created
 * 
 * This function intercepts ALL registration attempts (email/password, Google OAuth, etc.)
 * and blocks them if the email is not in the allowed list.
 * 
 * This cannot be bypassed by users - it runs on Firebase's servers.
 */
export const beforecreated = beforeUserCreated((event) => {
  const user = event.data;
  
  if (!user) {
    logger.warn("User registration blocked: No user data");
    throw new HttpsError(
      "invalid-argument",
      "Invalid user data"
    );
  }
  
  // Get user's email (lowercase for comparison)
  const email = user.email?.toLowerCase();
  
  if (!email) {
    logger.warn("User registration blocked: No email provided");
    throw new HttpsError(
      "invalid-argument",
      "Email address is required for registration"
    );
  }
  
  // Check if email is in allowed list
  const isEmailAllowed = ALLOWED_EMAILS.includes(email);
  
  // Check if domain is allowed
  const domain = email.split("@")[1];
  const isDomainAllowed = ALLOWED_DOMAINS.includes(domain);
  
  if (!isEmailAllowed && !isDomainAllowed) {
    logger.warn(`User registration blocked: ${email} not in allowed list`);
    throw new HttpsError(
      "permission-denied",
      "Registration is currently invite-only. Please contact support if you believe this is an error."
    );
  }
  
  logger.info(`User registration allowed: ${email}`);
  
  // Allow the user to be created
  return;
});
