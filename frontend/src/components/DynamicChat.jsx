import React, { useState, useRef, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useWeb3 } from '../context/Web3Context';
import algosdk from 'algosdk';
import ReactMarkdown from 'react-markdown';
import ZerionReceiptModal from './ZerionReceiptModal';

const DynamicChat = ({ documentId, publisherId, pdfUrl }) => {
  const { lute, account, refreshBalance } = useWeb3();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am the forensic AI assistant for this document. Ask me anything about this research paper. **Each prompt costs 0.05 ALGO.**',
      txId: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

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
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, txId: null }]);
    setIsProcessing(true);

    try {
      // 1. Look up Publisher's Wallet
      const publisherRef = doc(db, 'users', publisherId);
      const publisherSnap = await getDoc(publisherRef);
      if (!publisherSnap.exists() || !publisherSnap.data().walletAddress) {
        throw new Error("Could not find Publisher's wallet address.");
      }
      const receiverAddress = publisherSnap.data().walletAddress;

      // 2. Build Algorand Payment Transaction (0.05 ALGO)
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
        note: new Uint8Array(new TextEncoder().encode("EvidenceHub Zerion x402 Prompt"))
      });

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const txnBase64 = window.btoa(String.fromCharCode.apply(null, encodedTxn));

      // Calculate the Transaction ID locally before sending it to the network!
      const transactionId = txn.txID().toString();

      // 3. Sign & Broadcast
      const signedTxns = await lute.signTxns([{ txn: txnBase64 }]);
      await algodClient.sendRawTransaction(signedTxns[0]).do();

      await refreshBalance();

      // 4. Update Firestore
      const documentRef = doc(db, 'documents', documentId);
      await updateDoc(documentRef, {
        totalSalesALGO: increment(promptPrice)
      });

      // 5. Fetch Gemini AI Response
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: pdfUrl, question: userMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate AI response');

      // 6. Save AI Message WITH the Zerion Transaction ID
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.answer,
        txId: transactionId
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `❌ **Transaction or System Error:** ${error.message}`,
        txId: null
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const openReceipt = (txId) => {
    setSelectedTxId(txId);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[520px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live AI Oracle
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Pay-per-prompt • Zerion Verified x402</p>
        </div>
        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
          Zerion API Connected
        </span>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none prose prose-sm prose-p:my-1'
              }`}>
              {msg.sender === 'ai' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>

            {/* Zerion Receipt Trigger Button for AI Answers */}
            {msg.sender === 'ai' && msg.txId && (
              <button
                onClick={() => openReceipt(msg.txId)}
                className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors shadow-2xs"
              >
                <span>🧾</span> Verify Receipt (Zerion x402)
              </button>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 max-w-[85%] p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
              Signing 0.05 ALGO in Lute & Querying Zerion Gateway...
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
            className="flex-grow p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim() || !account}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm text-sm"
          >
            Send (0.05 ALGO)
          </button>
        </form>
      </div>

      {/* Zerion Receipt Modal Popup */}
      <ZerionReceiptModal
        txId={selectedTxId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DynamicChat;