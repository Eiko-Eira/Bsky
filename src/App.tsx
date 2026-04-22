import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { BotBuilder } from './pages/BotBuilder';
import { AboutUs, PrivacyPolicy, TermsOfService } from './pages/LegalPages';
import { ForgotPassword } from './pages/ForgotPassword';
import { CookieBanner } from './components/CookieBanner';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
          <header className="border-b border-black p-4 flex justify-between items-center sticky top-0 bg-white z-10">
            <Link to="/" className="font-black text-xl tracking-tighter">BSkyTools</Link>
          </header>
          
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/tos" element={<TermsOfService />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/builder" 
                element={
                  <ProtectedRoute>
                    <BotBuilder />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>

          <footer className="border-t border-black p-6 mt-auto">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold uppercase">
              <div>&copy; {new Date().getFullYear()} BSkyTools</div>
              <div className="flex gap-6">
                <Link to="/about" className="hover:underline">About Us</Link>
                <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                <Link to="/tos" className="hover:underline">Terms of Service</Link>
              </div>
            </div>
          </footer>
          <CookieBanner />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
