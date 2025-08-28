import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  onSnapshot,
  query,
  where,
  Firestore,
  // FIX: Add deleteDoc import for deleteUserFromList
  deleteDoc,
} from "firebase/firestore";
// FIX: Import UserProfile type for new user management functions
import type { GroceryItem, UserProfile } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.firebasestorage.app",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// --- Lazy Initializaion ---
// This prevents the app from crashing on startup if the config is invalid.
let app: FirebaseApp;
let db: Firestore;

const initializeDb = () => {
    if (!app) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
    return db;
}

// --- Real-time Item Management ---

export const subscribeToItems = (
    listId: string, 
    onUpdate: (items: GroceryItem[]) => void, 
    onError: (error: Error) => void
) => {
  const db = initializeDb();
  const itemsCollectionRef = collection(db, "lists", listId, "items");
  const unsubscribe = onSnapshot(itemsCollectionRef, (querySnapshot) => {
    const items = querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.id === 'string' && typeof data.name === 'string') // Data validation
        .map(data => data as GroceryItem);
    onUpdate(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
    onError(error);
  });
  return unsubscribe;
};

export const addItemToFirestore = async (item: GroceryItem, listId: string): Promise<void> => {
  const db = initializeDb();
  const itemDocRef = doc(db, "lists", listId, "items", item.id);
  await setDoc(itemDocRef, item);
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.update(document.ref, { purchased: newStatus });
    });
    await batch.commit();
};

export const deleteItemsByName = async (listId: string, itemName: string): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
}

export const deletePurchasedItems = async (listId: string): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("purchased", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
};

// --- User Management ---

// FIX: Add missing getUsersForList function for UserLogin component
export const getUsersForList = async (listId: string): Promise<UserProfile[]> => {
    const db = initializeDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.name === 'string' && typeof data.pinHash === 'string') // Data validation
        .map(data => data as UserProfile);
};

// FIX: Add missing createUserInList function for UserLogin component
export const createUserInList = async (listId: string, username: string, pinHash: string): Promise<void> => {
    const db = initializeDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");

    // The first user added to a list will automatically become an admin.
    const querySnapshot = await getDocs(usersCollectionRef);
    const isAdmin = querySnapshot.empty;

    const userDocRef = doc(db, "lists", listId, "users", username);
    const newUser: UserProfile = {
        name: username,
        pinHash,
        isAdmin,
    };
    await setDoc(userDocRef, newUser);
};

// FIX: Add missing deleteUserFromList function for UserLogin component
export const deleteUserFromList = async (listId: string, username: string): Promise<void> => {
    const db = initializeDb();
    const userDocRef = doc(db, "lists", listId, "users", username);
    await deleteDoc(userDocRef);
};