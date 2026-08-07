import React from 'react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-6 tracking-tight text-center">
        EvidenceHub AI
      </h1>
      <p className="text-xl text-gray-700 mb-10 text-center max-w-2xl leading-relaxed">
        The premier AI-powered Research Marketplace. Purchase premium documents, ask AI questions with verified provenance, and pay securely per-query using x402 and MetaMask.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all">
          Explore Research
        </button>
        <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all">
          Publisher Login
        </button>
      </div>
    </div>
  );
};

export default Home;