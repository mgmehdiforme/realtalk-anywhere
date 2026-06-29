import fs from "fs/promises";
import path from "path";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

export interface User {
  email: string;
  name: string;
  picture: string;
  createdAt: number;
}

export interface Assessment {
  email: string;
  answers: Record<string, any>;
  submittedAt: string | null;
  reportPdfPath: string | null;
  reportData: any | null;
  unlockRequestedAt?: string | null;
  unlockLinkedInUrl?: string | null;
}

export interface DatabaseSchema {
  users: Record<string, User>;
  assessments: Record<string, Assessment>;
}

let isInitialized = false;

// Simple memory cache and read-write lock to prevent concurrent write corruption
let dbCache: DatabaseSchema = { users: {}, assessments: {} };
let writeQueue: Promise<void> = Promise.resolve();

async function initDb() {
  if (isInitialized) return;
  
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const content = await fs.readFile(DB_PATH, "utf-8");
      dbCache = JSON.parse(content) as DatabaseSchema;
      // Ensure properties exist
      if (!dbCache.users) dbCache.users = {};
      if (!dbCache.assessments) dbCache.assessments = {};
    } catch (e) {
      // File doesn't exist, create it
      await fs.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
    }
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

/**
 * Persist cache to disk, queued to prevent overlapping writes
 */
async function saveToDisk(): Promise<void> {
  const performWrite = async () => {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
    } catch (error) {
      console.error("Database write failure:", error);
    }
  };

  writeQueue = writeQueue.then(performWrite);
  return writeQueue;
}

export async function getUser(email: string): Promise<User | null> {
  await initDb();
  return dbCache.users[email.toLowerCase()] || null;
}

export async function saveUser(user: Omit<User, "createdAt">): Promise<User> {
  await initDb();
  const emailKey = user.email.toLowerCase();
  const existingUser = dbCache.users[emailKey];
  
  const updatedUser: User = {
    ...user,
    email: emailKey,
    createdAt: existingUser ? existingUser.createdAt : Date.now(),
  };
  
  dbCache.users[emailKey] = updatedUser;
  await saveToDisk();
  return updatedUser;
}

export async function getAssessment(email: string): Promise<Assessment | null> {
  await initDb();
  return dbCache.assessments[email.toLowerCase()] || null;
}

export async function saveAssessment(email: string, answers: Record<string, any>): Promise<Assessment> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];
  
  if (existing && existing.submittedAt) {
    throw new Error("Assessment has already been submitted and cannot be modified.");
  }
  
  const updated: Assessment = {
    email: emailKey,
    answers: {
      ...(existing?.answers || {}),
      ...answers
    },
    submittedAt: existing ? existing.submittedAt : null,
    reportPdfPath: existing ? existing.reportPdfPath : null,
    reportData: existing ? existing.reportData : null,
    unlockRequestedAt: existing ? existing.unlockRequestedAt : null,
    unlockLinkedInUrl: existing ? existing.unlockLinkedInUrl : null,
  };
  
  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}

export async function submitAssessment(
  email: string, 
  reportPdfPath: string, 
  reportData: any
): Promise<Assessment> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];
  
  if (!existing) {
    throw new Error("No assessment answers found to submit.");
  }
  
  if (existing.submittedAt) {
    throw new Error("Assessment has already been submitted.");
  }
  
  const updated: Assessment = {
    ...existing,
    submittedAt: new Date().toISOString(),
    reportPdfPath,
    reportData,
  };
  
  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}

export async function requestUnlock(email: string, linkedinUrl: string): Promise<Assessment> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];
  if (!existing) {
    throw new Error("No assessment found to unlock.");
  }
  
  const updated: Assessment = {
    ...existing,
    unlockRequestedAt: new Date().toISOString(),
    unlockLinkedInUrl: linkedinUrl,
  };
  
  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}
