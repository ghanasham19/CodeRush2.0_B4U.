import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/publisher/Dashboard';
import Marketplace from './pages/researcher/Marketplace';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar /> 
            
            <main className="flex-grow pt-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Publisher Dashboard Route */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="publisher">
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Researcher Marketplace Route */}
                <Route 
                  path="/marketplace" 
                  element={
                    <ProtectedRoute requiredRole="researcher">
                      <Marketplace />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;