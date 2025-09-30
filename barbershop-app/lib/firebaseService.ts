// lib/firebaseService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface Booking {
  id?: string;
  name?: string; // For admin compatibility
  customerName: string;
  phone: string;
  service?: string;
  stylist?: string;
  date: string;
  time: string;
  price?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingFilters {
  phone?: string;
  date?: string;
  userId?: string;
}

class FirebaseService {
  private bookingsCollection = collection(db, 'bookings');

  async getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
    try {
      let q = query(this.bookingsCollection);

      // Always filter by user ID if provided
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      // Apply additional filters
      if (filters.phone) {
        q = query(q, where('phone', '==', filters.phone));
      }
      if (filters.date) {
        q = query(q, where('date', '==', filters.date));
      }

      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          name: data.customerName, // For admin compatibility
          customerName: data.customerName,
          phone: data.phone,
          service: data.service,
          stylist: data.stylist,
          date: data.date,
          time: data.time,
          price: data.price,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      // Sort by createdAt in JavaScript instead of Firestore
      return bookings.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Booking> {
    try {
      // Check for conflicts if stylist is specified
      if (bookingData.stylist) {
        const conflictQuery = query(
          this.bookingsCollection,
          where('stylist', '==', bookingData.stylist),
          where('date', '==', bookingData.date),
          where('time', '==', bookingData.time),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        const conflictSnapshot = await getDocs(conflictQuery);
        if (!conflictSnapshot.empty) {
          throw new Error('Time slot already booked');
        }
      }

      // Filter out undefined values before saving to Firestore
      const firestoreData = Object.fromEntries(
        Object.entries(bookingData).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(this.bookingsCollection, {
        ...firestoreData,
        userId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        id: docRef.id,
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error creating booking:', error);
      if (error.message === 'Time slot already booked') {
        throw error;
      }
      throw new Error('Failed to create booking');
    }
  }

  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled'): Promise<void> {
    try {
      const bookingRef = doc(this.bookingsCollection, bookingId);
      await updateDoc(bookingRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw new Error('Failed to update booking status');
    }
  }
}

export const firebaseService = new FirebaseService();
