import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Pure Web3 Authentication
  const loginWithWallet = async (walletAddress, signer, selectedRole = null) => {
    const cleanAddress = walletAddress.toLowerCase();
    
    // 1. Create a SIWE challenge message
    const timestamp = Date.now();
    const message = `Welcome to EvidenceHub AI!\n\nSign this message to prove you own this wallet.\n\nWallet: ${cleanAddress}\nTimestamp: ${timestamp}`;
    
    // 2. Request user to sign the message
    const signature = await signer.signMessage(message);
    if (!signature) throw new Error("Wallet signature rejected.");

    // 3. Check Firestore for existing user
    const userDocRef = doc(db, 'users', cleanAddress);
    const userDoc = await getDoc(userDocRef);

    let activeRole;

    if (userDoc.exists()) {
      // User exists -> fetch their saved role (ignores selectedRole)
      activeRole = userDoc.data().role;
    } else {
      // New User -> Must provide a role during registration
      if (!selectedRole) throw new Error("Role required for new registration.");
      activeRole = selectedRole;
      
      await setDoc(userDocRef, {
        walletAddress: cleanAddress,
        role: activeRole,
        createdAt: new Date().toISOString(),
        maxBudget: 50,
        spent: 0
      });
    }

    // 4. Construct Session
    const web3User = {
      uid: cleanAddress,
      walletAddress: cleanAddress,
      isWeb3: true
    };

    setCurrentUser(web3User);
    setUserRole(activeRole);
    
    localStorage.setItem('web3_session', JSON.stringify({ walletAddress: cleanAddress, role: activeRole }));
    return web3User;
  };

  const logout = () => {
    localStorage.removeItem('web3_session');
    setUserRole(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    const savedWeb3Session = localStorage.getItem('web3_session');
    if (savedWeb3Session) {
      try {
        const parsed = JSON.parse(savedWeb3Session);
        setCurrentUser({ uid: parsed.walletAddress, walletAddress: parsed.walletAddress, isWeb3: true });
        setUserRole(parsed.role);
      } catch (e) {
        localStorage.removeItem('web3_session');
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loginWithWallet, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};