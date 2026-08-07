import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const Marketplace = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplaceDocs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const docsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docsData);
      } catch (error) {
        console.error("Error fetching marketplace documents: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceDocs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Research Marketplace</h1>
        <p className="text-xl text-gray-600">Discover and query premium research with verified provenance.</p>
      </div>

      {loading ? (
        <div className="flex justify-center text-xl text-gray-500">Loading research database...</div>
      ) : documents.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No research documents available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-shadow">
              <div className="flex-grow">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Research Paper
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Added: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                <div className="text-2xl font-black text-gray-900">
                  ${doc.price}
                </div>
                <button className="bg-gray-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;