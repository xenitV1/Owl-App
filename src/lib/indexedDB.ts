'use client';

interface IDBConfig {
  name: string;
  version: number;
  stores: Array<{
    name: string;
    keyPath: string;
    indexes?: Array<{
      name: string;
      keyPath: string | string[];
      options?: IDBIndexParameters;
    }>;
  }>;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: IDBConfig;

  constructor(config: IDBConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, try to open with current version
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = request.error;
        console.error('IndexedDB error:', error);
        
        // If it's a version error, try to delete and recreate
        if (error?.name === 'VersionError') {
          console.log('Version conflict detected, recreating database...');
          this.recreateDatabase().then(resolve).catch(reject);
        } else {
          reject(new Error(`IndexedDB error: ${error}`));
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        this.config.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, { 
              keyPath: storeConfig.keyPath 
            });
            
            storeConfig.indexes?.forEach(indexConfig => {
              store.createIndex(
                indexConfig.name, 
                indexConfig.keyPath, 
                indexConfig.options
              );
            });
          }
        });
      };
    });
  }

  private async recreateDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close existing connection
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Delete existing database
      const deleteRequest = indexedDB.deleteDatabase(this.config.name);
      
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully, recreating...');
        // Now create new database
        this.init().then(resolve).catch(reject);
      };
      
      deleteRequest.onerror = () => {
        reject(new Error(`Failed to delete database: ${deleteRequest.error}`));
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Get operation failed: ${request.error}`));
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`GetAll operation failed: ${request.error}`));
      };
    });
  }

  async put<T>(storeName: string, data: T, silent: boolean = false): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        if (!silent) {
          console.log('💾 IndexedDB: Kaydedildi');
        }
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Kaydetme hatası');
        reject(new Error(`Put operation failed: ${request.error}`));
      };
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log('🗑️ IndexedDB: Silindi', key);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Silme hatası', key);
        reject(new Error(`Delete operation failed: ${request.error}`));
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Clear operation failed: ${request.error}`));
      };
    });
  }

  async count(storeName: string): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Count operation failed: ${request.error}`));
      };
    });
  }
}

// Workspace için IndexedDB konfigürasyonu
const workspaceConfig: IDBConfig = {
  name: 'owl-workspace',
  version: 4, // Rich Note editor için versiyon artırıldı
  stores: [
    {
      name: 'workspace',
      keyPath: 'id',
      indexes: [
        { name: 'lastModified', keyPath: 'lastModified' },
        { name: 'version', keyPath: 'version' }
      ]
    },
    {
      name: 'cards',
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'zIndex', keyPath: 'zIndex' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },
    {
      name: 'progress',
      keyPath: 'id',
      indexes: [
        { name: 'lastUpdated', keyPath: 'lastUpdated' },
        { name: 'cardId', keyPath: 'cardId' }
      ]
    },
    {
      name: 'flashcards',
      keyPath: 'id',
      indexes: [
        { name: 'nextReview', keyPath: 'nextReview' },
        { name: 'category', keyPath: 'category' },
        { name: 'type', keyPath: 'type' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },
    {
      name: 'flashcardStats',
      keyPath: 'id',
      indexes: [
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'studySessions',
      keyPath: 'id',
      indexes: [
        { name: 'startTime', keyPath: 'startTime' },
        { name: 'sessionDate', keyPath: 'sessionDate' }
      ]
    },
    {
      name: 'richNotes',
      keyPath: 'id',
      indexes: [
        { name: 'cardId', keyPath: 'cardId' },
        { name: 'lastModified', keyPath: 'lastModified' },
        { name: 'folder', keyPath: 'folder' }
      ]
    }
  ]
};

// Singleton instance
export const workspaceDB = new IndexedDBManager(workspaceConfig);


// IndexedDB desteği kontrolü
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}


// Debug utility: IndexedDB'deki flashcard sayısını kontrol et
export async function checkIndexedDBFlashcards(): Promise<{ count: number; error?: string }> {
  try {
    if (!isIndexedDBSupported()) {
      return { count: 0, error: 'IndexedDB desteklenmiyor' };
    }

    const count = await workspaceDB.count('flashcards');
    return { count };
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : 'Bilinmeyen hata' };
  }
}
