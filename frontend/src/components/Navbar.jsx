import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { account, disconnectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await disconnectWallet(); // Disconnect Pera Wallet
      logout(); // Clear local session
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Algorand addresses are 58 chars long
  const formatAddress = (address) => {
    return address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center z-50 relative">
      <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight flex items-center gap-2">
        EvidenceHub AI
      </Link>
      
      <div className="flex items-center space-x-6">
        {currentUser ? (
          <>
            <div className="border-r border-gray-200 pr-6 hidden sm:block">
              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-semibold text-gray-700 font-mono">
                  {formatAddress(account || currentUser.walletAddress)}
                </span>
                <span className="text-sm font-bold text-yellow-600">
                  Algorand
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-sm hidden md:block">
                Role: <span className="text-blue-600 capitalize">{userRole}</span>
              </span>
              
              {userRole === 'publisher' && (
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                  Dashboard
                </Link>
              )}
              
              {userRole === 'researcher' && (
                <Link to="/marketplace" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                  Marketplace
                </Link>
              )}
              
              <button 
                onClick={handleLogout}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
              Log In
            </Link>
            <Link to="/register" className="bg-gray-900 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;