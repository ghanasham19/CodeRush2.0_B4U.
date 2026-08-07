import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([{ text: '', price: '' }]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const q = query(collection(db, 'documents'), where('publisherId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const docsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docsData);
      } catch (error) {
        console.error("Error fetching documents: ", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchDocuments();
  }, [currentUser]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', price: '' }]);
  };

  const handleRemoveQuestion = (index) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQs = [...questions];
    newQs[index][field] = value;
    setQuestions(newQs);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || questions.length === 0) {
      return alert("Please fill all fields and add at least one question.");
    }
    
    // Validate all questions have text and a valid price
    for (let q of questions) {
      if (!q.text || !q.price || Number(q.price) <= 0) {
        return alert("Every question must have text and a valid ALGO price.");
      }
    }

    setIsUploading(true);
    try {
      // 1. Upload PDF to our local Node.js Backend using FormData
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Backend upload failed");
      
      const uploadData = await uploadResponse.json();
      const downloadURL = uploadData.url;

      // 2. Save metadata to Firestore using the new array schema
      const newDoc = {
        title,
        pdfUrl: downloadURL,
        publisherId: currentUser.uid,
        questions: questions.map(q => ({ text: q.text, price: Number(q.price) })),
        createdAt: new Date().toISOString(),
        totalSalesALGO: 0
      };
      
      const docRef = await addDoc(collection(db, 'documents'), newDoc);
      
      // 3. Update local state to reflect UI instantly
      setDocuments([{ id: docRef.id, ...newDoc }, ...documents]);
      
      // Reset form
      setShowModal(false);
      setTitle('');
      setFile(null);
      setQuestions([{ text: '', price: '' }]);
    } catch (error) {
      console.error("Error uploading file: ", error);
      alert("Upload failed. Make sure backend is running on port 5000.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publisher Dashboard</h1>
          <p className="text-gray-600 mt-1">Upload research and price specific AI insights in ALGO.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 shadow-sm transition-colors"
        >
          + Upload Research
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center text-gray-500 py-10">Loading your documents...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-lg">You haven't uploaded any research yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Available Questions</th>
                <th className="px-6 py-4">Total Sales (ALGO)</th>
                <th className="px-6 py-4">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-6 py-4">{doc.questions?.length || 0} Questions</td>
                  <td className="px-6 py-4 font-bold text-yellow-600">{doc.totalSalesALGO || 0} ALGO</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload & Setup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Define AI Insights</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all" placeholder="e.g. Advanced AI Models" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PDF File</label>
                  <input type="file" required accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Pre-defined AI Questions</h3>
                  <button type="button" onClick={handleAddQuestion} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 font-bold transition-colors">
                    + Add Question
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {questions.map((q, index) => (
                    <div key={index} className="flex space-x-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Question {index + 1}</label>
                        <input 
                          type="text" 
                          required 
                          value={q.text} 
                          onChange={e => handleQuestionChange(index, 'text', e.target.value)} 
                          className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" 
                          placeholder="e.g. What is the core methodology?" 
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price (ALGO)</label>
                        <input 
                          type="number" 
                          required 
                          min="0.01" 
                          step="0.01" 
                          value={q.price} 
                          onChange={e => handleQuestionChange(index, 'price', e.target.value)} 
                          className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" 
                          placeholder="0.50" 
                        />
                      </div>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuestion(index)} className="mt-6 text-gray-400 hover:text-red-500 text-xl font-bold px-2">
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={isUploading} className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-md disabled:opacity-50 flex items-center">
                  {isUploading ? 'Uploading & Saving...' : 'Publish Research'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;