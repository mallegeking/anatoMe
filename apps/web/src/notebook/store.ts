import type { NotebookEntry } from "./types";

export type NotebookStore = {
  list(): Promise<NotebookEntry[]>; // newest first
  put(entry: NotebookEntry): Promise<void>;
  putMany(entries: NotebookEntry[]): Promise<void>; // one transaction
  remove(id: string): Promise<void>;
};

const DB_NAME = "anatome-notebook";
const STORE = "entries";

// Wraps one request in a promise.
function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("The notebook store failed."));
  });
}

// Waits until a transaction has fully finished.
function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("The notebook store failed."));
    tx.onabort = () => reject(new Error("The notebook store failed."));
  });
}

// Opens the notebook database. Rejects when there is no IndexedDB or opening fails.
export function openNotebook(factory: IDBFactory | undefined = globalThis.indexedDB): Promise<NotebookStore> {
  if (!factory) return Promise.reject(new Error("This browser has no IndexedDB."));
  return new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = factory.open(DB_NAME, 1);
    } catch {
      reject(new Error("The notebook could not be opened."));
      return;
    }
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("The notebook could not be opened."));
    req.onblocked = () => reject(new Error("The notebook could not be opened."));
  }).then((db) => {
    let asked = false;
    // Asks the browser once to keep the data. The answer does not matter.
    const askToKeep = () => {
      if (asked) return;
      asked = true;
      try {
        const persist = globalThis.navigator?.storage?.persist;
        if (typeof persist === "function") void Promise.resolve(persist.call(navigator.storage)).catch(() => {});
      } catch {
        // Ignored on purpose.
      }
    };
    const write = async (fn: (s: IDBObjectStore) => void) => {
      const tx = db.transaction(STORE, "readwrite");
      const finished = done(tx);
      fn(tx.objectStore(STORE));
      await finished;
      askToKeep();
    };
    return {
      async list() {
        const tx = db.transaction(STORE, "readonly");
        const all = (await wrap(tx.objectStore(STORE).getAll())) as NotebookEntry[];
        return all.sort((a, b) => b.createdAt - a.createdAt);
      },
      put: (entry) => write((s) => void s.put(entry)),
      putMany: (entries) =>
        write((s) => {
          for (const e of entries) s.put(e);
        }),
      remove: (id) => write((s) => void s.delete(id)),
    };
  });
}
