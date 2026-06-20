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
    const itemId = String(item.id);
    
    try {
      await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .doc(itemId)
        .set(item);
    } catch (error) {
      console.error(`Firebase: Failed to push to ${storeName}/${itemId}:`, error);
    }
  }

  /**
   * Delete single item from Firestore
   */
  async deleteFromCloud(storeName, id) {
    if (!this.db || !this.currentUser) return;
    
    const uid = this.currentUser.uid;
    const itemId = String(id);
    
    try {
      await this.db
        .collection('users')
        .doc(uid)
        .collection(storeName)
        .doc(itemId)
        .delete();
    } catch (error) {
      console.error(`Firebase: Failed to delete from ${storeName}/${itemId}:`, error);
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
}

// Export singleton instance globally
window.firebaseSync = new ZenFlowFirebase();
