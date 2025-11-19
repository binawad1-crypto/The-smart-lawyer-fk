
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ADMIN_EMAIL } from '../constants';
import { AppUser, SubscriptionInfo } from '../types';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;
    let unsubscribeCustomerDoc: (() => void) | undefined;
    let unsubscribeSubscription: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      // Clean up previous listeners
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeCustomerDoc) unsubscribeCustomerDoc();
      if (unsubscribeSubscription) unsubscribeSubscription();
      
      setCurrentUser(null);

      if (user) {
        setLoading(true);
        // State pieces to build the final user object
        // FIX: Replaced `Omit` with `Pick` for a more stable type definition. This resolves an issue where the compiler could not find the 'status' property.
        let userData: Pick<AppUser, 'isAdmin' | 'status' | 'tokenBalance' | 'location'> | null = null;
        let customerData: { stripeId?: string } | null = null;
        let subscriptionData: SubscriptionInfo | undefined = undefined;
        const userAuthData: User = user;

        const assembleAndSetUser = () => {
          // We must have the basic user data before setting the user state.
          if (!userData) {
            return;
          }

          // Check for disabled status
          if (userData.status === 'disabled') {
              if (auth.currentUser) signOut(auth);
              return;
          }

          const finalUser: AppUser = {
            ...userAuthData,
            ...userData,
            // The Stripe extension writes stripeId to the /customers/{uid} document.
            // We prioritize it from there.
            stripeId: customerData?.stripeId,
            subscription: subscriptionData,
          };
          
          setCurrentUser(finalUser);
          setLoading(false);
        };
        
        // Listener 1: User document in 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserDoc = onSnapshot(userDocRef, 
          (userDocSnap) => {
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              userData = {
                isAdmin: user.email === ADMIN_EMAIL,
                status: data.status,
                tokenBalance: data.tokenBalance ?? 0,
                location: data.location || '',
              };
            } else {
              // User doc doesn't exist, log them out.
              if (auth.currentUser) signOut(auth);
              return;
            }
            assembleAndSetUser();
          }, 
          (error) => {
            console.error("Error fetching user data:", error);
            if (auth.currentUser) signOut(auth);
          }
        );

        // Listener 2: Customer document in 'customers' collection for stripeId
        const customerDocRef = doc(db, 'customers', user.uid);
        unsubscribeCustomerDoc = onSnapshot(customerDocRef, 
          (customerDocSnap) => {
            customerData = customerDocSnap.exists() ? customerDocSnap.data() : null;
            assembleAndSetUser();
          },
          (error) => {
            console.error("Error fetching customer data:", error);
            customerData = null;
            assembleAndSetUser();
          }
        );

        // Listener 3: Subscription sub-collection
        // CHANGED: Read from 'customers' collection where Stripe writes subscriptions
        const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
        const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));
        unsubscribeSubscription = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            subscriptionData = undefined;
          } else {
            const subDoc = snapshot.docs[0];
            const subData = subDoc.data();
            const planId = subData.isManual 
              ? subData.planId 
              : subData.items[0]?.price.product.metadata.planId || 'unknown';

            subscriptionData = {
              id: subDoc.id,
              planId: planId,
              stripeSubscriptionId: subData.isManual ? undefined : subDoc.id,
              status: subData.status,
              current_period_end: subData.current_period_end.seconds,
              priceId: subData.isManual ? 'manual' : subData.items[0]?.price.id,
              isManual: subData.isManual || false,
            };
          }
          assembleAndSetUser();
        }, (error) => {
            console.error("Error fetching subscription:", error);
            subscriptionData = undefined;
            assembleAndSetUser();
        });

      } else {
        // No user is signed in.
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the useEffect hook.
    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeCustomerDoc) unsubscribeCustomerDoc();
      if (unsubscribeSubscription) unsubscribeSubscription();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
