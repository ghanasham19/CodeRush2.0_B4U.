import React, { useState, useRef, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useWeb3 } from '../context/Web3Context';
import algosdk from 'algosdk';
import ReactMarkdown from 'react-markdown';

const DynamicChat = ({ documentId, publisherId, pdfUrl }) => {
  const { lute, account, refreshBalance } = useWeb3();
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Hello! I am the forensic AI assistant for this document. Ask me anything about this research paper. **Each prompt costs 0.05 ALGO.**' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !account) return;

    const userMessage = input.trim();
    setInput(''); // Clear input immediately for UX
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsProcessing(true);

    try {
      // 1. Look up Publisher's Wallet Address
      const publisherRef = doc(db, 'users', publisherId);
      const publisherSnap = await getDoc(publisherRef);
      if (!publisherSnap.exists() || !publisherSnap.data().walletAddress) {
        throw new Error("Could not find Publisher's wallet address.");
      }
      const receiverAddress = publisherSnap.data().walletAddress;

      // 2. Build Web3 Transaction (0.05 ALGO per prompt)
      const safeSender = String(account).trim();
      const safeReceiver = String(receiverAddress).trim();
      const promptPrice = 0.05;
      const amountInMicroAlgos = Math.floor(promptPrice * 1000000);

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: safeSender,
    receiver: safeReceiver,
    amount: amountInMicroAlgos,
    suggestedParams,
    note: new Uint8Array(
        new TextEncoder().encode("EvidenceHub Dynamic Prompt")
    )
});

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const txnBase64 = window.btoa(String.fromCharCode.apply(null, encodedTxn));

      // 3. Sign & Broadcast Transaction
      const signedTxns = await lute.signTxns([{ txn: txnBase64 }]);
      await algodClient.sendRawTransaction(signedTxns[0]).do();
      
      // Update UI balance instantly
      await refreshBalance();

      // 4. Update Publisher Total Sales in Firebase
      const documentRef = doc(db, 'documents', documentId);
      await updateDoc(documentRef, {
        totalSalesALGO: increment(promptPrice)
      });

      // 5. Fetch AI Insight from Backend
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: pdfUrl, question: userMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate AI response');

      // 6. Append AI Answer
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `❌ **Transaction or System Error:** ${error.message}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live AI Oracle
        </h3>
        <p className="text-xs text-gray-500 mt-1">Pay-per-prompt • Verifiable Citations</p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none prose prose-sm prose-p:my-1'
            }`}>
              {msg.sender === 'ai' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 max-w-[85%] p-3 rounded-2xl rounded-tl-none text-sm animate-pulse flex items-center gap-2">
              <span>Signing 0.05 ALGO in Lute & Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || !account}
            placeholder={account ? "Ask a specific question..." : "Connect wallet to chat"}
            className="flex-grow p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim() || !account}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
          >
            Send (0.05 ALGO)
          </button>
        </form>
      </div>
    </div>
  );
};

export default DynamicChat;