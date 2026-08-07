import React, { createContext, useContext, useState, useEffect } from 'react';
import LuteConnect from 'lute-connect';
import algosdk from 'algosdk';

// Initialize Lute globally
const lute = new LuteConnect("EvidenceHub AI");

const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [algoBalance, setAlgoBalance] = useState("0.000");

  // Function to fetch the live balance from the Algorand TestNet
  const fetchBalance = async (address) => {
    if (!address) return;
    try {
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const accountInfo = await algodClient.accountInformation(address).do();
      
      // Explicitly convert BigInt to Number to prevent type errors
      const microAlgos = Number(accountInfo.amount || 0);
      const balanceInAlgos = microAlgos / 1000000;
      
      setAlgoBalance(balanceInAlgos.toFixed(3));
    } catch (error) {
      console.error("Error fetching ALGO balance:", error);
      setAlgoBalance("0.000");
    }
  };

  useEffect(() => {
    // Restore session and fetch balance if user refreshes the page
    const savedAccount = localStorage.getItem('lute_account');
    if (savedAccount) {
      setAccount(savedAccount);
      fetchBalance(savedAccount);
    }
  }, []);

  const connectWallet = async () => {
    try {
      const addresses = await lute.connect('testnet-v1.0');
      if (addresses && addresses.length > 0) {
        const newAccount = addresses[0];
        setAccount(newAccount);
        localStorage.setItem('lute_account', newAccount);
        
        // Fetch balance immediately after connecting
        await fetchBalance(newAccount);
        return newAccount;
      }
    } catch (error) {
      console.error("Lute Connect error:", error);
    }
    return null;
  };

  const disconnectWallet = async () => {
    setAccount(null);
    setAlgoBalance("0.000");
    localStorage.removeItem('lute_account');
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      lute, 
      algoBalance, 
      connectWallet, 
      disconnectWallet,
      refreshBalance: () => fetchBalance(account)
    }}>
      {children}
    </Web3Context.Provider>
  );
};