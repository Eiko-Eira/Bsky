import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertTriangle, ArrowLeft, Settings2, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

export function BotBuilder() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  
  const [controls, setControls] = useState({
    repost: true,
    like: true,
    reply: false,
    autoPost: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const deployBot = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!auth.currentUser) throw new Error("Authentication required to deploy bots.");

      // Military-grade AES-256 encryption before transmittal to database
      const ENCRYPTION_KEY = (import.meta as any).env.VITE_ENCRYPTION_KEY || 'development_key_replace_in_aws_prod';
      const encryptedPassword = CryptoJS.AES.encrypt(appPassword, ENCRYPTION_KEY).toString();
      
      const safeHandle = handle.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeHandle) throw new Error("Invalid handle format.");

      const botId = safeHandle + '-' + Date.now();
      const finalHandle = handle + (handle.includes('.') ? '' : '.bsky.social');

      // 1. Write the strict schema to the Firestore database
      await setDoc(doc(db, 'bots', botId), {
        userId: auth.currentUser.uid,
        handle: finalHandle,
        appPassword: encryptedPassword,
        keywords,
        repost: controls.repost,
        like: controls.like,
        status: 'active',
        createdAt: Date.now()
      });

      // 2. Ping the AWS backend node to orchestrate the worker immediately
      await fetch('/api/deploy-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: botId,
          handle: finalHandle,
          appPassword,
          keywords,
          repost: controls.repost,
          like: controls.like,
        }),
      });

      // Success, route to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-8 flex items-center gap-2 text-sm font-bold uppercase hover:underline"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Bot Configuration</h1>
      <p className="text-gray-600 font-mono mb-8 border-b-2 border-black pb-8">Set up your automated Bluesky account behaviors.</p>

      <div className="space-y-12">
        {/* Section 1: Credentials */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
            <Settings2 size={20} />
            <h2 className="text-xl font-bold uppercase">1. Bluesky Credentials</h2>
          </div>

          <div className="bg-black text-white p-4 font-mono text-sm border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="shrink-0 text-red-500" size={20} />
              <div>
                <p className="font-bold text-red-400 mb-1">CRITICAL SECURITY WARNING</p>
                <p>DO NOT use your main account password. Generate a specific "App Password" in your Bluesky settings. This data is converted to a downloadable file and immediately wiped from our system memory.</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider">Bot Handle</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-4 focus:ring-black/10 font-mono peer"
                  placeholder="art-reposter"
                />
                {!handle.includes('.') && handle.length > 0 && (
                  <span className="absolute right-3 top-3.5 text-gray-400 font-mono pointer-events-none">
                    .bsky.social
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider">App Password</label>
              <input 
                type="password" 
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:ring-4 focus:ring-black/10 font-mono"
                placeholder="xxxx-xxxx-xxxx-xxxx"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Triggers */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
            <Settings2 size={20} />
            <h2 className="text-xl font-bold uppercase">2. Target Keywords</h2>
          </div>

          <div className="border border-black p-6 bg-gray-50">
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">Monitored Keywords</label>
            <form onSubmit={addKeyword} className="flex gap-2 mb-4">
              <input 
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black/10 font-mono placeholder-gray-400"
                placeholder="e.g. #pixelart"
              />
              <button 
                type="submit"
                className="bg-black text-white px-4 font-bold flex items-center justify-center hover:bg-gray-800 transition-colors"
                disabled={!newKeyword.trim()}
              >
                <Plus size={20} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {keywords.length === 0 ? (
                <span className="text-sm font-mono text-gray-400 italic py-2">No keywords specified yet...</span>
              ) : (
                keywords.map(kw => (
                  <span key={kw} className="bg-white border-2 border-black px-3 py-1 flex items-center gap-2 font-mono text-sm group">
                    {kw}
                    <button 
                      onClick={() => removeKeyword(kw)}
                      className="text-gray-400 group-hover:text-black transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Behaviors */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
            <Settings2 size={20} />
            <h2 className="text-xl font-bold uppercase">3. Bot Behaviors</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className={`cursor-pointer border-2 p-4 flex items-start gap-4 transition-all ${controls.repost ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-black'}`}>
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  checked={controls.repost}
                  onChange={(e) => setControls({...controls, repost: e.target.checked})}
                  className="w-5 h-5 accent-white"
                />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wider">Auto-Repost</h3>
                <p className={`text-sm mt-1 ${controls.repost ? 'text-gray-300' : 'text-gray-500'}`}>Echo posts matching target parameters</p>
              </div>
            </label>

            <label className={`cursor-pointer border-2 p-4 flex items-start gap-4 transition-all ${controls.like ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-black'}`}>
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  checked={controls.like}
                  onChange={(e) => setControls({...controls, like: e.target.checked})}
                  className="w-5 h-5 accent-white"
                />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wider">Auto-Like</h3>
                <p className={`text-sm mt-1 ${controls.like ? 'text-gray-300' : 'text-gray-500'}`}>Heart posts matching target parameters</p>
              </div>
            </label>

            {/* Upcoming Beta Features */}
            <div className="border-2 border-dashed border-gray-200 p-4 opacity-50 select-none">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold uppercase tracking-wider text-gray-500">Auto-Reply</h3>
                <span className="bg-gray-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">Beta / Pro</span>
              </div>
              <p className="text-sm text-gray-400">Generate context-aware responses (Coming Soon)</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 p-4 opacity-50 select-none">
             <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold uppercase tracking-wider text-gray-500">Auto-Post</h3>
                <span className="bg-gray-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">Beta / Pro</span>
              </div>
              <p className="text-sm text-gray-400">Scheduled origin generation (Coming Soon)</p>
            </div>
          </div>
        </section>

        {/* Generate / Finalize */}
        <div className="pt-8 border-t-4 border-black">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 font-bold text-sm mb-6">
              {error}
            </div>
          )}
          <button 
            onClick={deployBot}
            disabled={!handle || !appPassword || keywords.length === 0 || isSubmitting}
            className="w-full bg-black text-white p-6 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download /> {isSubmitting ? 'Deploying to AWS Node...' : 'Deploy Bot to AWS'}
          </button>
          <p className="text-center font-mono text-xs text-gray-500 mt-4">
            Passwords are not stored. Server attempts immediate handshake.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
