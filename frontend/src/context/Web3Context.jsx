import React, { createContext, useContext, useState, useEffect } from 'react';
import LuteConnect from 'lute-connect';

// Initialize Lute globally
const lute = new LuteConnect("EvidenceHub AI");

const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    // Restore session if user refreshes the page
    const savedAccount = localStorage.getItem('lute_account');
    if (savedAccount) setAccount(savedAccount);
  }, []);

  const connectWallet = async () => {
    try {
      // Prompt the Lute web UI to connect explicitly to TestNet
      const addresses = await lute.connect('testnet-v1.0');
      if (addresses && addresses.length > 0) {
        setAccount(addresses[0]);
        localStorage.setItem('lute_account', addresses[0]);
        return addresses[0];
      }
    } catch (error) {
      console.error("Lute Connect error:", error);
    }
    return null;
  };

  const disconnectWallet = async () => {
    setAccount(null);
    localStorage.removeItem('lute_account');
  };

  return (
    <Web3Context.Provider value={{ account, lute, connectWallet, disconnectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};