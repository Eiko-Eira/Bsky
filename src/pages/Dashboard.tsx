import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Plus, Settings, Power, LogOut, Pause, Activity, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, collection, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeBots, setActiveBots] = useState<any[]>([]);
  const [runningAwsBots, setRunningAwsBots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBot, setEditingBot] = useState<any | null>(null);
  const [logsBot, setLogsBot] = useState<any | null>(null);
  const [botLogs, setBotLogs] = useState<any[]>([]);
  const [editKeywords, setEditKeywords] = useState<string>('');
  const [editControls, setEditControls] = useState({ like: false, repost: false });

  // Poll AWS Server for active memory health every 5 seconds
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const res = await fetch('/api/bots');
        const data = await res.json();
        setRunningAwsBots(data.activeIds || []);
      } catch (e) {
        console.error("AWS Health Ping Failed");
      }
    };
    
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Securely query only bots belonging to the connected user
    const q = query(collection(db, 'bots'), where("userId", "==", user.uid));
    
    // Real-time listener: The dashboard updates instantly when AWS changes DB state
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const botsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveBots(botsData);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard DB stream failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleBotStatus = async (bot: any) => {
    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    
    // Update DB
    await updateDoc(doc(db, 'bots', bot.id), { status: newStatus });
    
    // Tell AWS AWS
    if (newStatus === 'paused') {
      await fetch('/api/stop-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bot.id })
      });
    } else {
      await fetch('/api/deploy-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bot) // resend to fire up
      });
    }
  };

  const syncAWSNode = async (bot: any) => {
    await fetch('/api/deploy-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bot)
    });
  }

  const openLogModal = async (bot: any) => {
    setLogsBot(bot);
    setBotLogs([]);
    try {
      const res = await fetch(`/api/logs/${bot.id}`);
      const data = await res.json();
      setBotLogs(data.logs || []);
    } catch {
      console.error("Failed to load logs");
    }
  };

  const openEditModal = (bot: any) => {
    setEditingBot(bot);
    setEditKeywords(bot.keywords.join(', '));
    setEditControls({ like: bot.like, repost: bot.repost });
  };

  const saveEdit = async () => {
    if (!editingBot) return;
    const kwArray = editKeywords.split(',').map(s => s.trim()).filter(Boolean);
    if (!kwArray.length) return;

    const updates = { keywords: kwArray, like: editControls.like, repost: editControls.repost };
    
    // Update DB
    await updateDoc(doc(db, 'bots', editingBot.id), updates);
    
    // Tell AWS (It uses the DB data if we pass the whole config, but our API takes the config body as full)
    const newBotState = { ...editingBot, ...updates };
    await fetch('/api/update-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBotState)
    });

    setEditingBot(null);
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to completely delete this Bot Instance?')) return;

    await deleteDoc(doc(db, 'bots', botId));
    await fetch('/api/stop-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: botId })
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight">Dashboard</h1>
          <p className="text-gray-600 font-mono mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {activeBots.length} Active Bot Instances
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold uppercase hover:bg-black hover:text-white px-3 py-2 border border-transparent hover:border-black transition-colors"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {user && !user.emailVerified && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 text-sm flex gap-3 shadow-[4px_4px_0px_0px_rgba(234,179,8,0.4)]">
          <Activity className="shrink-0 mt-0.5" size={18} />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <strong className="block mb-1">Verification Required</strong>
              We sent a verification link to {user.email}. You must verify your email before deploying bots.
            </div>
            <button 
              onClick={async () => {
                await auth.currentUser?.reload();
                window.location.reload(); 
              }}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              I Clicked It
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Card */}
        <button 
          onClick={(e) => {
            if (user && !user.emailVerified) {
              e.preventDefault();
              alert("Please verify your email address first.");
            } else {
              navigate('/builder');
            }
          }}
          className={`group h-48 border-2 border-dashed border-black ${user && !user.emailVerified ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white hover:bg-gray-50 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'} flex flex-col items-center justify-center gap-4`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${user && !user.emailVerified ? 'bg-gray-400 text-gray-200' : 'bg-black text-white group-hover:scale-110'}`}>
            <Plus size={24} />
          </div>
          <span className="font-bold uppercase tracking-widest">{user && !user.emailVerified ? 'Verify Email to Build' : 'Create New Bot'}</span>
        </button>

        {/* Existing Bot Card */}
        {activeBots.map(bot => {
          const isHealthy = runningAwsBots.includes(bot.id);
          
          return (
          <div key={bot.id} className="border-2 border-black p-6 flex flex-col justify-between bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-lg leading-none">{bot.handle}</h3>
                  <p className="text-xs font-mono text-gray-500 mt-1">ID: ...{bot.id.slice(-6)}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 flex items-center gap-1 ${bot.status === 'active' ? 'bg-black text-white' : 'bg-gray-300 text-black'}`}>
                {bot.status === 'active' ? <Power size={10} /> : <Pause size={10} />} {bot.status}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-2">Monitored Keywords</p>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {bot.keywords.map((kw: string) => (
                    <span key={kw} className="bg-gray-100 border border-black px-2 py-1">{kw}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-2">AWS Node Health</p>
                <div className={`p-2 text-xs font-mono font-bold flex items-center gap-2 border-2 uppercase ${isHealthy ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
                  <Activity size={14} className={isHealthy ? 'animate-pulse' : ''} /> 
                  {isHealthy ? 'Healthy / Running' : 'Offline / Error'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-4 justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => toggleBotStatus(bot)}
                  className="text-sm font-bold flex items-center gap-2 hover:underline text-gray-500 hover:text-black"
                >
                  {bot.status === 'active' ? <Pause size={16} /> : <Power size={16} />}
                  {bot.status === 'active' ? 'Pause Bot' : 'Start Bot'}
                </button>
  
                <button 
                  onClick={() => deleteBot(bot.id)}
                  className="text-sm font-bold flex items-center gap-2 hover:underline text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => openEditModal(bot)}
                  className="text-sm font-bold flex items-center gap-2 hover:underline text-gray-500 hover:text-black"
                >
                  <Settings size={16} /> Edit
                </button>
                <button 
                  onClick={() => openLogModal(bot)}
                  className="text-sm font-bold flex items-center gap-2 hover:underline text-gray-500 hover:text-black"
                >
                  <FileText size={16} /> Activity
                </button>
              </div>

              {!isHealthy && bot.status === 'active' && (
                <button 
                  onClick={() => syncAWSNode(bot)}
                  className="text-sm font-bold uppercase text-red-600 hover:underline border border-red-500 px-2 py-1"
                >
                  Restart Interrupted Node
                </button>
              )}
            </div>
          </div>
        )})}

        {!loading && activeBots.length === 0 && (
          <div className="border-2 border-gray-200 border-dashed h-48 flex items-center justify-center text-gray-400 font-mono text-sm p-6 text-center">
            No active bots running on AWS yet. Deploy a new bot to get started.
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingBot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border-4 border-black p-8 w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tight">Edit Configuration</h2>
                <button onClick={() => setEditingBot(null)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold uppercase tracking-wider">Keywords (Comma Separated)</label>
                  <textarea 
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    className="w-full border-2 border-black p-3 focus:outline-none focus:ring-4 focus:ring-black/10 font-mono text-sm min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm font-bold uppercase tracking-wider">Automated Actions</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={editControls.like} onChange={(e) => setEditControls(prev => ({ ...prev, like: e.target.checked }))} />
                      <div className={`w-12 h-6 border-2 border-black transition-colors ${editControls.like ? 'bg-black' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white border-2 border-black transition-transform ${editControls.like ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                    <span className="font-bold group-hover:text-gray-600 transition-colors">Like matching posts</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={editControls.repost} onChange={(e) => setEditControls(prev => ({ ...prev, repost: e.target.checked }))} />
                      <div className={`w-12 h-6 border-2 border-black transition-colors ${editControls.repost ? 'bg-black' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white border-2 border-black transition-transform ${editControls.repost ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                    <span className="font-bold group-hover:text-gray-600 transition-colors">Repost to profile</span>
                  </label>
                </div>
                
                <button onClick={saveEdit} className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {logsBot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border-4 border-black p-8 w-full max-w-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[70vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Activity /> Activity Logs - {logsBot.handle}
                </h2>
                <button onClick={() => setLogsBot(null)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 bg-black p-4 overflow-y-auto space-y-2 text-green-400 font-mono text-sm leading-tight border-2 border-black">
                {botLogs.length === 0 ? (
                  <p className="opacity-50 text-center mt-10">No recent activity detected. Connect the bot on AWS to start syncing.</p>
                ) : (
                  botLogs.map((log: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-green-700 pl-3">
                      <span className="opacity-50 text-xs mr-2">[{new Date(log.time).toLocaleTimeString()}]</span>
                      {log.msg}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
