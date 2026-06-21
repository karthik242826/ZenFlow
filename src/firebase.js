/**
 * ZenFlowFirebase - Firebase compat SDK integration wrapper
 */
class ZenFlowFirebase {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.config = null;
    this.currentUser = null;
  }

  /**
   * Initialize Firebase dynamically with saved or provided credentials
   * @param {Object} config 
   * @returns {boolean} - Success of configuration
   */
  init(config) {
    if (!config || !config.apiKey || !config.projectId) {
      console.warn('Firebase: Incomplete configuration credentials.');
      return false;
    }
    
    try {
      this.config = config;
      // Initialize Firebase App
      this.app = firebase.initializeApp(config);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      
      // Enable offline persistence in Firestore natively
      this.db.enablePersistence().catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore offline persistence: multiple tabs open, persistence disabled.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore offline persistence: browser does not support persistence.');
        }
      });
      
      console.log('Firebase: Initialized successfully.');
      return true;
    } catch (error) {
      console.error('Firebase: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Monitor authentication changes
   * @param {Function} callback 
   */
  onAuthStateChanged(callback) {
    if (!this.auth) return;
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      callback(user);
    });
  }

  /**
   * Sign In User
   */
  signIn(email, password) {
    if (!this.auth) return Promise.reject(new Error('Firebase Auth is not initialized'));
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Sign Up/Register User
   */
  signUp(email, password) {
    if (!this.auth) return Promise.reject(new Error('Firebase Auth is not initialized'));
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  /**
   * Sign Out User
   */
  signOut() {
    if (!this.auth) return Promise.reject(new Error('Firebase Auth is not initialized'));
    return this.auth.signOut();
  }

  /**
   * Sign In with Google Popup
   */
  signInWithGoogle() {
    if (!this.auth) return Promise.reject(new Error('Firebase Auth is not initialized'));
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.auth.signInWithPopup(provider);
  }

  /**
   * Push single item to Firestore
   * Path: users/{uid}/{storeName}/{itemId}
   */
  async pushToCloud(storeName, item) {
    if (!this.db || !this.currentUser) return;
    
    const uid = this.currentUser.uid;
    // Use the stable cloudId UUID as the Firestore doc key so the same item
    // maps to the same document on every device. Fall back to stringified
    // local id only for legacy items that pre-date this change.
    const docId = item.cloudId || String(item.id);
    
    try {
      await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .doc(docId)
        .set(item);
    } catch (error) {
      console.error(`Firebase: Failed to push to ${storeName}/${docId}:`, error);
    }
  }

  /**
   * Delete single item from Firestore.
   * @param {string} storeName
   * @param {Object} item - the full item object (needs cloudId or id)
   */
  async deleteFromCloud(storeName, item) {
    if (!this.db || !this.currentUser) return;
    
    const uid = this.currentUser.uid;
    // Resolve the Firestore document ID the same way pushToCloud does.
    const docId = (item && item.cloudId) ? item.cloudId : String(item && item.id !== undefined ? item.id : item);
    
    try {
      await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .doc(docId)
        .delete();
    } catch (error) {
      console.error(`Firebase: Failed to delete from ${storeName}/${docId}:`, error);
    }
  }

  /**
   * Pull all items for a store from Firestore
   */
  async pullFromCloud(storeName) {
    if (!this.db || !this.currentUser) return [];
    
    const uid = this.currentUser.uid;
    
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .get();
        
      const items = [];
      snapshot.forEach(doc => {
        items.push(doc.data());
      });
      return items;
    } catch (error) {
      console.error(`Firebase: Failed to pull ${storeName} store:`, error);
      throw error;
    }
  }

  /**
   * Clears Firestore collection for a store
   */
  async clearCloudStore(storeName) {
    if (!this.db || !this.currentUser) return;
    
    const uid = this.currentUser.uid;
    
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .get();
        
      const batch = this.db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error(`Firebase: Failed to clear cloud store ${storeName}:`, error);
    }
  }

  /**
   * Start real-time sync for all stores
   * @param {Function} onSyncComplete - Callback when database changes and UI needs reload/render
   */
  startSync(onSyncComplete) {
    if (!this.db || !this.currentUser) return;
    this.stopSync();
    
    const uid = this.currentUser.uid;
    const stores = ['timetable', 'todos', 'notes', 'history'];
    this.syncUnsubscribes = [];
    
    stores.forEach(storeName => {
      let isInitial = true;
      const unsub = this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .onSnapshot(async (snapshot) => {
          try {
            // Get all cloud items
            const cloudItems = [];
            snapshot.forEach(doc => {
              cloudItems.push(doc.data());
            });
            
            // Get all local items
            const localItems = await window.db.getAll(storeName);
            
            // Map local items by cloudId for fast lookup
            const localMap = new Map();
            localItems.forEach(item => {
              if (item.cloudId) {
                localMap.set(item.cloudId, item);
              }
            });
            
            let hasChanges = false;
            const cloudIds = new Set();
            
            // 1. Process items from cloud snapshot (add or update locally)
            for (const cloudItem of cloudItems) {
              const cloudId = cloudItem.cloudId;
              if (!cloudId) continue;
              cloudIds.add(cloudId);
              
              const localItem = localMap.get(cloudId);
              if (localItem) {
                // Check if they are actually different before updating
                const updatedItem = { ...cloudItem, id: localItem.id };
                if (JSON.stringify(localItem) !== JSON.stringify(updatedItem)) {
                  await window.db.update(storeName, updatedItem);
                  hasChanges = true;
                }
              } else {
                // Add new item to IndexedDB
                const newItem = { ...cloudItem };
                delete newItem.id; // Let IndexedDB assign new ID
                await window.db.add(storeName, newItem);
                hasChanges = true;
              }
            }
            
            // 2. Remove local items that are not in the cloud snapshot
            // Note: We only delete if they have a cloudId (to avoid deleting legacy items that don't have one yet)
            for (const localItem of localItems) {
              if (localItem.cloudId && !cloudIds.has(localItem.cloudId)) {
                await window.db.delete(storeName, localItem.id);
                hasChanges = true;
              }
            }
            
            // 3. For the initial load, if the cloud is completely empty for this store,
            // we should upload the local items that are currently in IndexedDB.
            if (isInitial && snapshot.empty && localItems.length > 0) {
              for (const item of localItems) {
                await this.pushToCloud(storeName, item);
              }
            }
            
            if ((isInitial || hasChanges) && onSyncComplete) {
              onSyncComplete();
            }
            isInitial = false;
          } catch (err) {
            console.error(`Firebase Sync: Error processing update for ${storeName}:`, err);
          }
        }, error => {
          console.error(`Firebase Sync: error for ${storeName}:`, error);
          if (isInitial && onSyncComplete) {
            onSyncComplete();
          }
          isInitial = false;
        });
        
      this.syncUnsubscribes.push(unsub);
    });
  }

  /**
   * Stop real-time sync and unsubscribe
   */
  stopSync() {
    if (this.syncUnsubscribes && this.syncUnsubscribes.length > 0) {
      this.syncUnsubscribes.forEach(unsub => {
        try {
          unsub();
        } catch (e) {
          console.error('Firebase Sync: error during unsubscribe:', e);
        }
      });
      this.syncUnsubscribes = [];
    }
  }
}

// Export singleton instance globally
window.firebaseSync = new ZenFlowFirebase();
