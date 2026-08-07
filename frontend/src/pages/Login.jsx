import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithWallet } = useAuth();
  const { account, signer, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleWeb3Login = async () => {
    try {
      setError('');
      setLoading(true);
      
      let currentSigner = signer;
      let currentAccount = account;

      if (!currentAccount || !currentSigner) {
        await connectWallet();
        return; 
      }

      // We pass null for role because existing users fetch their role from Firestore
      await loginWithWallet(currentAccount, currentSigner, null);
      navigate('/');
    } catch (err) {
      setError('Authentication failed: ' + (err.message || 'Signature rejected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-8">Sign in with your Web3 Wallet</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center text-sm">{error}</div>}

        <button 
          type="button"
          onClick={handleWeb3Login}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md flex items-center justify-center space-x-3 text-lg"
        >
          <span className="text-2xl">🦊</span>
          <span>{account ? 'Sign In' : 'Connect MetaMask'}</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-8">
          New to EvidenceHub? <Link to="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;