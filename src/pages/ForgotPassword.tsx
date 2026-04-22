import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox to change your password.');
    } catch (err: any) {
      setError('Failed to send reset email. ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-20"
    >
      <div className="border border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Reset Password</h1>
        <p className="text-gray-600 mb-8 font-mono text-sm">Enter your email and we'll send you a link to reset your password.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm font-bold">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 text-sm font-bold">
              {message}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-bold uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-black p-3 focus:outline-none focus:ring-4 focus:ring-black/10 font-mono transition-all"
              placeholder="john@example.com"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link to="/login" className="text-sm font-bold uppercase hover:underline flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
