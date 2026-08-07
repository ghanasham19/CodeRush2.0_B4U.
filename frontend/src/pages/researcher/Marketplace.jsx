import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';
import ReactMarkdown from 'react-markdown';
import algosdk from 'algosdk';

const Marketplace = () => {
  const { currentUser } = useAuth();
  const { lute, account } = useWeb3();

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedDoc, setSelectedDoc] = useState(null);

  const [maxBudget, setMaxBudget] = useState(0);
  const [spent, setSpent] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState('');

  const [unlockedAnswers, setUnlockedAnswers] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setMaxBudget(userSnap.data().maxBudget || 0);
          setSpent(userSnap.data().spent || 0);
        }

        const querySnapshot = await getDocs(collection(db, 'documents'));
        const docsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docsData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { maxBudget: Number(newBudgetInput) });
      setMaxBudget(Number(newBudgetInput));
      setShowBudgetModal(false);
    } catch (error) {
      alert("Failed to update budget.");
    }
  };

  const handleUnlockQuestion = async (questionIndex, price, questionText) => {
    if (spent + price > maxBudget) {
      return alert("Transaction declined: This exceeds your ALGO budget limit!");
    }

    setIsProcessing(questionIndex);

    try {
      const senderAddress = account;
      if (!senderAddress) {
        throw new Error("Your Lute wallet is not connected. Please refresh and log in again.");
      }

      // Look up the Publisher's real Algorand Wallet Address using Firebase
      const publisherRef = doc(db, 'users', selectedDoc.publisherId);
      const publisherSnap = await getDoc(publisherRef);

      if (!publisherSnap.exists() || !publisherSnap.data().walletAddress) {
        throw new Error("Could not find the Publisher's Algorand wallet address in the database.");
      }

      const receiverAddress = publisherSnap.data().walletAddress;

      console.log(`[Web3] Preparing to send ${price} ALGO`);
      console.log(`[Web3] From: ${senderAddress}`);
      console.log(`[Web3] To: ${receiverAddress}`);

      // 1. Force strict string conversion and trim
      const safeSender = String(senderAddress).trim();
      const safeReceiver = String(receiverAddress).trim();

      // 2. Native Algorand Validation Check
      if (!algosdk.isValidAddress(safeSender)) {
        throw new Error(`CRITICAL: Sender address is invalid: "${safeSender}"`);
      }
      if (!algosdk.isValidAddress(safeReceiver)) {
        throw new Error(`CRITICAL: Receiver address is invalid: "${safeReceiver}"`);
      }

      // 3. Connect to Algorand TestNet
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const suggestedParams = await algodClient.getTransactionParams().do();

      // 4. Safest math for microAlgos conversion
      const amountInMicroAlgos = Math.floor(Number(price) * 1000000);

      // 5. Use the raw base Transaction constructor (Bypasses helper function bugs)
      const txn = new algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: safeSender,
    receiver: safeReceiver,
    amount: amountInMicroAlgos,
    suggestedParams,
    note: new Uint8Array(
        new TextEncoder().encode("EvidenceHub Insight")
    )
});

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const txnBase64 = window.btoa(String.fromCharCode.apply(null, encodedTxn));

      // Trigger Lute to sign
      const signedTxns = await lute.signTxns([{ txn: txnBase64 }]);

      // Broadcast to network
      const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
      console.log(`✅ Transaction Broadcasted! TXID: ${txId}`);

      // Update Local Budget
      const newSpent = spent + price;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { spent: newSpent });
      setSpent(newSpent);

      // Fetch AI Insight
      const response = await fetch('http://localhost:5000/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentUrl: selectedDoc.pdfUrl,
          question: questionText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch AI insight');
      }

      setUnlockedAnswers(prev => ({
        ...prev,
        [questionIndex]: data.answer
      }));

    } catch (error) {
      console.error(error);
      alert("Transaction failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingBudget = maxBudget - spent;
  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (selectedDoc) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => { setSelectedDoc(null); setUnlockedAnswers({}); }}
            className="text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            ← Back to Marketplace
          </button>
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-sm shadow">
            Budget: <span className={remainingBudget <= 0 ? 'text-red-400' : 'text-green-400'}>{remainingBudget.toFixed(2)} ALGO</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Document Preview
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">{selectedDoc.title}</h2>
              <p className="text-gray-500 text-sm mb-6">Published by: {selectedDoc.publisherId.slice(0,8)}...</p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-600 text-sm italic">
                  "Full document text is hidden to protect intellectual property. Purchase specific insights on the right to extract verified data via AI."
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3">
            <h3 className="text-xl font-bold mb-4">Available AI Insights</h3>

            {(!selectedDoc.questions || selectedDoc.questions.length === 0) ? (
              <p className="text-gray-500">The publisher has not defined any questions for this document yet.</p>
            ) : (
              <div className="space-y-4">
                {selectedDoc.questions.map((q, index) => {
                  const isUnlocked = unlockedAnswers[index];
                  const isLoading = isProcessing === index;

                  return (
                    <div key={index} className={`p-6 rounded-2xl border transition-all ${isUnlocked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-gray-900 pr-4">{q.text}</h4>

                        {!isUnlocked && (
                          <button
                            onClick={() => handleUnlockQuestion(index, q.price, q.text)}
                            disabled={isProcessing !== false || !account}
                            className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <span>🟡 {q.price} ALGO</span>
                            <span>Unlock</span>
                          </button>
                        )}
                      </div>

                      {isLoading && (
                        <div className="mt-4 text-blue-600 font-bold text-sm animate-pulse flex items-center gap-2">
                          <span>Sign transaction in Lute & Analyzing document...</span>
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wider mb-4 block">AI Response & Provenance</span>
                          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed marker:text-yellow-500 prose-headings:font-bold prose-headings:text-gray-900 prose-strong:text-blue-700">
                            <ReactMarkdown>{unlockedAnswers[index]}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-900 rounded-2xl p-6 mb-8 text-white flex flex-col md:flex-row justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-1">Web3 Research Terminal</h2>
          <p className="text-gray-400 text-sm">Pay-per-insight via Algorand x402 Protocol</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-6">
          <div className="text-right">
            <p className="text-gray-400 text-sm uppercase tracking-wider font-bold">ALGO Budget</p>
            <p className={`text-3xl font-black ${remainingBudget <= 0 ? 'text-red-500' : 'text-green-400'}`}>
              {remainingBudget.toFixed(2)}
            </p>
          </div>
          <button onClick={() => setShowBudgetModal(true)} className="border border-gray-600 hover:border-white px-4 py-2 rounded-lg transition-colors font-semibold">
            Set Limit
          </button>
        </div>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for research papers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-6 py-4 rounded-xl border border-gray-300 shadow-sm text-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center text-xl text-gray-500">Searching database...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No documents match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-shadow">
              <div className="flex-grow">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {doc.questions?.length || 0} Insights
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2 line-clamp-2">{doc.title}</h3>
                <p className="text-gray-500 text-sm mb-4">Author: {doc.publisherId.slice(0,6)}...</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Enter Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-2">Set Maximum Budget</h2>
            <p className="text-gray-600 mb-6 text-sm">Set your maximum ALGO spend limit to protect your Wallet.</p>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Budget (ALGO)</label>
                <input type="number" required min="1" step="0.1" value={newBudgetInput} onChange={e => setNewBudgetInput(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-lg outline-none focus:border-yellow-400" placeholder="e.g. 50" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;