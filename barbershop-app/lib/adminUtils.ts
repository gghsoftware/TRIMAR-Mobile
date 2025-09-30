// lib/adminUtils.ts
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const promoteToAdmin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw new Error('Failed to promote user to admin');
  }
};

export const demoteFromAdmin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'customer',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error demoting admin:', error);
    throw new Error('Failed to demote admin');
  }
};
