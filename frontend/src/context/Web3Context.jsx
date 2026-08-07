import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed! Please install the browser extension.");
      return;
    }

    try {
      // Ethers v6 Syntax for connecting to MetaMask
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Prompt user to connect their wallet
      await browserProvider.send("eth_requestAccounts", []);
      
      const currentSigner = await browserProvider.getSigner();
      const currentAccount = await currentSigner.getAddress();
      
      // Fetch balance in Wei and convert to ETH
      const currentBalanceWei = await browserProvider.getBalance(currentAccount);
      const currentBalance = ethers.formatEther(currentBalanceWei);

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setBalance(parseFloat(currentBalance).toFixed(4));
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  // Listen for account changes in MetaMask (e.g., user switches wallets)
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet(); // Re-fetch details for the new account
        } else {
          // User disconnected their wallet completely
          setAccount(null);
          setBalance(null);
          setSigner(null);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, balance, provider, signer, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};