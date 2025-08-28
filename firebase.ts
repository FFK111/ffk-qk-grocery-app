import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  getDoc
} from "firebase/firestore";
import type { GroceryItem } from "./types";

// Firebase config for your project
const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.appspot.com",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch grocery items from a specific list in Firestore
export const fetchItems = async (listId: string): Promise<GroceryItem[]> => {
  try {
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const querySnapshot = await getDocs(itemsCollectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GroceryItem[];
  } catch (error) {
    console.error("Error fetching items from Firestore:", error);
    return [];
  }
};

// Add a new grocery item to a specific list in Firestore
export const addItemToFirestore = async (item: GroceryItem, listId: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, "lists", listId, "items", item.id);
    await setDoc(itemDocRef, item);
  } catch (error) {
    console.error("Error adding item to Firestore:", error);
    throw error;
  }
};

// Delete all items from a specific list in Firestore
export const deleteAllItemsFromFirestore = async (listId: string): Promise<void> => {
  try {
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const querySnapshot = await getDocs(itemsCollectionRef);
    if (querySnapshot.empty) {
        return; // Nothing to delete
    }
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting all items:", error);
    throw error;
  }
};

// --- User Management Functions ---

export interface UserProfile {
    name: string;
    pinHash: string;
}

// Fetch all users for a specific list
export const getUsersForList = async (listId: string): Promise<UserProfile[]> => {
    try {
        const usersCollectionRef = collection(db, "lists", listId, "users");
        const querySnapshot = await getDocs(usersCollectionRef);
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

// Create a new user in a specific list
export const createUserInList = async (listId: string, username: string, pinHash: string): Promise<void> => {
    try {
        const userDocRef = doc(db, "lists", listId, "users", username.toLowerCase());
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            throw new Error("Username already exists in this list.");
        }
        await setDoc(userDocRef, { name: username, pinHash });
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};