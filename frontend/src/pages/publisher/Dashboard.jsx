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
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !price) return alert("Please fill all fields");

    setIsUploading(true);
    try {
      // 1. Upload PDF to our Node.js Backend using FormData
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData, // No Content-Type header needed, browser sets it automatically for FormData
      });

      if (!uploadResponse.ok) throw new Error("Backend upload failed");
      
      const uploadData = await uploadResponse.json();
      const downloadURL = uploadData.url; // We get our local server URL back!

      // 2. Save metadata to Firestore (completely free)
      const newDoc = {
        title,
        price: Number(price),
        pdfUrl: downloadURL,
        publisherId: currentUser.uid,
        createdAt: new Date().toISOString(),
        purchases: 0
      };
      
      const docRef = await addDoc(collection(db, 'documents'), newDoc);
      
      // 3. Update local state so table refreshes instantly
      setDocuments([{ id: docRef.id, ...newDoc }, ...documents]);
      
      // Reset form
      setShowModal(false);
      setTitle('');
      setPrice('');
      setFile(null);
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
          <p className="text-gray-600 mt-1">Manage and monetize your research.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-sm"
        >
          + Upload Research
        </button>
      </div>

      {loading ? (
        <p>Loading your documents...</p>
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
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Sales</th>
                <th className="px-6 py-4">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-6 py-4">${doc.price}</td>
                  <td className="px-6 py-4">{doc.purchases}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (e.g., 5)</label>
                <input type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PDF File</label>
                <input type="file" required accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border rounded" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                  {isUploading ? 'Uploading...' : 'Publish'}
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