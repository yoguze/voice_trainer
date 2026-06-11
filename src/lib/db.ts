import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Session } from "@/types";

interface VoiceTrainerDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "voice-trainer-db";
const STORE_NAME = "sessions";

let dbPromise: Promise<IDBPDatabase<VoiceTrainerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<VoiceTrainerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VoiceTrainerDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, session);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb();
  const sessions = await db.getAllFromIndex(STORE_NAME, "by-createdAt");
  return sessions.reverse();
}

export async function clearSessions(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}
