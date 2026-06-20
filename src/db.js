/**
 * ZenFlowDB - IndexedDB wrapper for local browser storage
 */
class ZenFlowDB {
  constructor() {
    this.dbName = 'ZenFlowDB';
    this.dbVersion = 2;
    this.db = null;
  }

  /**
   * Re-initialize the DB with a user-scoped name.
   * Closes any existing connection first so the next call to init()
   * opens the correct per-user database.
   * @param {string|null} uid - Firebase user UID, or null to reset to anonymous store.
   */
  setUser(uid) {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.dbName = uid ? `ZenFlowDB_${uid}` : 'ZenFlowDB';
  }

  /**
   * Initializes the IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database failed to open:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for timetable events
        if (!db.objectStoreNames.contains('timetable')) {
          const timetableStore = db.createObjectStore('timetable', { keyPath: 'id', autoIncrement: true });
          timetableStore.createIndex('day', 'day', { unique: false });
          timetableStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Store for todos
        if (!db.objectStoreNames.contains('todos')) {
          const todosStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
          todosStore.createIndex('priority', 'priority', { unique: false });
          todosStore.createIndex('completed', 'completed', { unique: false });
          todosStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // Store for notes
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('pinned', 'pinned', { unique: false });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store for activity log history
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Execute a database transaction in a safe way
   * @param {string} storeName 
   * @param {string} mode - 'readonly' or 'readwrite'
   * @returns {Promise<IDBObjectStore>}
   */
  async getStore(storeName, mode = 'readonly') {
    await this.init();
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Get all items from a specific store
   * @param {string} storeName 
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single item by ID
   * @param {string} storeName 
   * @param {number} id 
   * @returns {Promise<Object>}
   */
  async get(storeName, id) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(Number(id));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add a new item to a store
   * @param {string} storeName 
   * @param {Object} item 
   * @returns {Promise<number>} - ID of the added item
   */
  async add(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing item in a store
   * @param {string} storeName 
   * @param {Object} item 
   * @returns {Promise<number>} - ID of the updated item
   */
  async update(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an item from a store
   * @param {string} storeName 
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async delete(storeName, id) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(Number(id));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items in a store
   * @param {string} storeName 
   * @returns {Promise<void>}
   */
  async clearStore(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export all database data to a JSON object
   * @returns {Promise<Object>}
   */
  async exportData() {
    const timetable = await this.getAll('timetable');
    const todos = await this.getAll('todos');
    const notes = await this.getAll('notes');
    const history = await this.getAll('history');
    return {
      version: this.dbVersion,
      exportedAt: new Date().toISOString(),
      timetable,
      todos,
      notes,
      history
    };
  }

  /**
   * Import data back into the database stores
   * @param {Object} data 
   * @returns {Promise<boolean>}
   */
  async importData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup data format');
    }

    // Clear current database stores
    await this.clearStore('timetable');
    await this.clearStore('todos');
    await this.clearStore('notes');
    await this.clearStore('history');

    // Populate timetable store
    if (Array.isArray(data.timetable)) {
      for (const item of data.timetable) {
        delete item.id; // Allow new IDs to be generated
        await this.add('timetable', item);
      }
    }

    // Populate todos store
    if (Array.isArray(data.todos)) {
      for (const item of data.todos) {
        delete item.id;
        await this.add('todos', item);
      }
    }

    // Populate notes store
    if (Array.isArray(data.notes)) {
      for (const item of data.notes) {
        delete item.id;
        await this.add('notes', item);
      }
    }

    // Populate history store
    if (Array.isArray(data.history)) {
      for (const item of data.history) {
        delete item.id;
        await this.add('history', item);
      }
    }

    return true;
  }
}

// Export a singleton instance globally
window.db = new ZenFlowDB();
