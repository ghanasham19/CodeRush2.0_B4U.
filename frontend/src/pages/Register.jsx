import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Register = () => {
  const [role, setRole] = useState('researcher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithWallet } = useAuth();
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleWeb3Register = async () => {
    try {
      setError('');
      setLoading(true);
      
      let currentAccount = account;
      if (!currentAccount) {
        currentAccount = await connectWallet();
        if (!currentAccount) throw new Error("Wallet connection cancelled.");
      }

      await loginWithWallet(currentAccount, role);
      navigate('/');
    } catch (err) {
      setError('Registration failed: ' + (err.message || 'Connection rejected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-500 mb-8">Register using your Lute Identity</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center text-sm">{error}</div>}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Role</label>
          <select 
            value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-semibold text-gray-800"
          >
            <option value="researcher">Buy & Read Research (Researcher)</option>
            <option value="publisher">Upload & Sell Research (Publisher)</option>
          </select>
        </div>

        <button 
          type="button"
          onClick={handleWeb3Register}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md flex items-center justify-center space-x-3 text-lg"
        >
          <span className="text-2xl">🌀</span>
          <span>{account ? `Register as ${role}` : 'Connect Lute Wallet'}</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;