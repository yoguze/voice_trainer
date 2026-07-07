import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AudioRecording, Session } from "@/types";

interface VoiceTrainerDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-createdAt": number };
  };
  recordings: {
    key: string;
    value: AudioRecording;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "voice-trainer-db";
const SESSION_STORE_NAME = "sessions";
const RECORDING_STORE_NAME = "recordings";
const MAX_RECORDINGS = 100;

let dbPromise: Promise<IDBPDatabase<VoiceTrainerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<VoiceTrainerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VoiceTrainerDB>(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
          const store = db.createObjectStore(SESSION_STORE_NAME, {
            keyPath: "id",
          });
          store.createIndex("by-createdAt", "createdAt");
        }

        if (!db.objectStoreNames.contains(RECORDING_STORE_NAME)) {
          const store = db.createObjectStore(RECORDING_STORE_NAME, {
            keyPath: "id",
          });
          store.createIndex("by-createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.put(SESSION_STORE_NAME, session);
}

export async function saveSessionWithRecording(
  session: Session,
  blob: Blob,
): Promise<void> {
  const db = await getDb();
  const audioRecordingId = crypto.randomUUID();
  const sessionWithAudio: Session = {
    ...session,
    audioRecordingId,
  };
  const recording: AudioRecording = {
    id: audioRecordingId,
    sessionId: session.id,
    createdAt: session.createdAt,
    blob,
    mimeType: blob.type,
  };

  const tx = db.transaction(
    [SESSION_STORE_NAME, RECORDING_STORE_NAME],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore(SESSION_STORE_NAME).put(sessionWithAudio),
    tx.objectStore(RECORDING_STORE_NAME).put(recording),
  ]);
  await tx.done;
  await pruneOldRecordings();
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb();
  const sessions = await db.getAllFromIndex(SESSION_STORE_NAME, "by-createdAt");
  return sessions.reverse();
}

export async function getRecording(
  id: string,
): Promise<AudioRecording | undefined> {
  const db = await getDb();
  return db.get(RECORDING_STORE_NAME, id);
}

export async function clearSessions(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [SESSION_STORE_NAME, RECORDING_STORE_NAME],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore(SESSION_STORE_NAME).clear(),
    tx.objectStore(RECORDING_STORE_NAME).clear(),
  ]);
  await tx.done;
}

async function pruneOldRecordings(): Promise<void> {
  const db = await getDb();
  const recordings = await db.getAllFromIndex(
    RECORDING_STORE_NAME,
    "by-createdAt",
  );
  const deleteCount = recordings.length - MAX_RECORDINGS;

  if (deleteCount <= 0) return;

  const tx = db.transaction(
    [SESSION_STORE_NAME, RECORDING_STORE_NAME],
    "readwrite",
  );
  const sessionStore = tx.objectStore(SESSION_STORE_NAME);
  const recordingStore = tx.objectStore(RECORDING_STORE_NAME);

  await Promise.all(
    recordings.slice(0, deleteCount).map(async (recording) => {
      await recordingStore.delete(recording.id);
      const session = await sessionStore.get(recording.sessionId);

      if (session?.audioRecordingId === recording.id) {
        const sessionWithoutAudio: Session = { ...session };
        delete sessionWithoutAudio.audioRecordingId;
        await sessionStore.put(sessionWithoutAudio);
      }
    }),
  );
  await tx.done;
}
