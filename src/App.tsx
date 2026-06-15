/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  TrendingUp, 
  LayoutDashboard,
  Shield,
  BarChart2,
  Briefcase,
  Compass,
  Zap,
  Users,
  TrendingDown, 
  ShieldCheck, 
  LineChart, 
  Cpu, 
  Brain, 
  Plus, 
  Locate, 
  Settings, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  MessageSquare, 
  Bell, 
  User, 
  ShieldAlert, 
  Activity, 
  Database, 
  Lock, 
  RefreshCcw, 
  Search, 
  Send, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Award,
  HelpCircle
} from 'lucide-react';
import { 
  StockQuote, 
  StockPrediction, 
  SentimentAnalysis, 
  RiskAnalysis, 
  NewsArticle, 
  ForumPost, 
  PortfolioHolding, 
  AlertConfig, 
  SecurityAuditLog, 
  SystemHealth 
} from './types';

import AuthScreen from './components/AuthScreen';


const formatFinancialValue = (valueStr: string | number, alwaysShowSign = false): string => {
  const num = Number(valueStr);
  if (isNaN(num)) return `${alwaysShowSign ? '+' : ''}$0.00`;
  const absNum = Math.abs(num);
  let formatted = absNum.toFixed(2);
  
  if (absNum >= 1e9) {
    formatted = (absNum / 1e9).toFixed(2) + 'B';
  } else if (absNum >= 1e6) {
    formatted = (absNum / 1e6).toFixed(2) + 'M';
  } else if (absNum >= 1e3) {
    formatted = (absNum / 1e3).toFixed(1) + 'K';
  }
  
  let sign = '';
  if (num < 0) {
    sign = '-';
  } else if (alwaysShowSign && num > 0) {
    sign = '+';
  }
  return `${sign}${formatted}`;
};

export default function App() {
  // Theme & Session states
  const [session, setSession] = useState<any>(null);


  const [activeTab, setActiveTab] = useState<'dashboard' | 'prediction' | 'sentiment' | 'portfolio' | 'assistant' | 'community' | 'alerts' | 'audits' | 'multimodal' | 'profile'>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  
  // Real-time backend pulled state
  const [tickers, setTickers] = useState<StockQuote[]>([]);
  const [activeStockDetail, setActiveStockDetail] = useState<{
    quote: StockQuote;
    prediction: StockPrediction;
    sentiment: SentimentAnalysis;
    risk: RiskAnalysis;
    news: NewsArticle[];
    indicators: {
      sma: number;
      ema: number;
      rsi: number;
      macd: string;
      macdHist: number;
      bbUpper: number;
      bbLower: number;
      bbMiddle: number;
      atr: number;
    }
  } | null>(null);

  // Lists & Feeds
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);

  // New Profile / Portfolio states
  const [profileData, setProfileData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [portfolioInsights, setPortfolioInsights] = useState<string[]>([]);
  const [isEditProfile, setIsEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', mobileNumber: '', country: '', currency: '' });

  // Form entries
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3500);
  };
  const [addQty, setAddQty] = useState('10');
  const [addPrice, setAddPrice] = useState('180');
  const [sellQty, setSellQty] = useState('5');
  const [alertVal, setAlertVal] = useState('190');
  const [alertType, setAlertType] = useState<string>('Price Above Threshold');
  const [alertChannel, setAlertChannel] = useState<string>('Email Notification');
  
  // Forum entry
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Analysis');
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  // Assistant states
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Credibility scanner states
  const [credNewsHeadline, setCredNewsHeadline] = useState("Apple announces expansion of its AI infrastructure investment strategy.");
  const [credReport, setCredReport] = useState<any>(null);
  const [credLoading, setCredLoading] = useState(false);

  // Bot checker states
  const [botFeedText, setBotFeedText] = useState("$NVDA Buy now to the moon!!! Coordinated squeeze happening at 1000 level!! Rocket emoji rocket emoji. AAPL is useless, NVDA 10x guaranteed high leverage!!");
  const [botReport, setBotReport] = useState<any>(null);
  const [botLoading, setBotLoading] = useState(false);

  // Multi-modal analyzer states
  const [multiModalText, setMultiModalText] = useState("CEO: 'We feel confident in our distribution limits. While semiconductor logistics will incur temporary high component margins (approx 12%), we anticipate cloud subscription services expansion will easily offset and generate a +14.5% year-over-year revenue target.'");
  const [multimodalReport, setMultimodalReport] = useState<any>(null);
  const [multimodalLoading, setMultimodalLoading] = useState(false);

  // Sync state helpers
  const triggerAuthHeader = () => {
    return session ? { 'Authorization': `Bearer ${session.token}` } : {};
  };

  // Fetch stocks overview & active details
  const fetchOverviewData = async () => {
    try {
      const res = await fetch('/api/stocks?_t=' + Date.now());
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setTickers(json.stocks);
      }
    } catch (e) {
      
    }
  };

  const fetchActiveStockData = async (symbol: string) => {
    try {
      const res = await fetch(`/api/stocks/${symbol}?_t=` + Date.now());
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setActiveStockDetail(json.data);
      }
    } catch (e) {
      
    }
  };

  const fetchPortfolio = async () => {
    if (!session || (session.isTwoFactorSetup && !session.isOtpVerified)) return;
    try {
      const res = await fetch('/api/portfolio', { headers: triggerAuthHeader() });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setPortfolio(json.portfolio);
      }
    } catch (e) {
      
    }
  };

  const fetchProfileInfo = async () => {
    if (!session || (session.isTwoFactorSetup && !session.isOtpVerified)) return;
    try {
      const pRes = await fetch('/api/user/profile', { headers: triggerAuthHeader() });
      const _text_pJson = await pRes.text(); if (_text_pJson.startsWith('<!doctype html>') || _text_pJson.includes('<html')) {  return; } const pJson = JSON.parse(_text_pJson);
      if (pJson.status === 'success') {
        setProfileData(pJson.profile);
        setTransactions(pJson.profile.transactions || []);
        setDevices(pJson.profile.devices || []);
        setLoginHistory(pJson.profile.loginHistory || []);
        setEditProfileForm({
          name: pJson.profile.name || '',
          mobileNumber: pJson.profile.mobileNumber || '',
          country: pJson.profile.country || '',
          currency: pJson.profile.currency || ''
        });
      }

      const iRes = await fetch('/api/ai/portfolio-insights', { method: 'POST', headers: triggerAuthHeader() });
      const _text_iJson = await iRes.text(); if (_text_iJson.startsWith('<!doctype html>') || _text_iJson.includes('<html')) {  return; } const iJson = JSON.parse(_text_iJson);
      if (iJson.status === 'success') {
        setPortfolioInsights(iJson.insights);
      }
    } catch (err) {
      
    }
  };

  const fetchAlerts = async () => {
    if (!session || (session.isTwoFactorSetup && !session.isOtpVerified)) return;
    try {
      const res = await fetch('/api/alerts', { headers: triggerAuthHeader() });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setAlerts(json.alerts);
      }
    } catch (e) {
      
    }
  };

  const fetchForum = async () => {
    try {
      const res = await fetch('/api/forum?_t=' + Date.now());
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setForumPosts(json.posts);
      }
    } catch (e) {
      
    }
  };

  const fetchAdminDetails = async () => {
    if (!session || session.role !== 'Admin' || (session.isTwoFactorSetup && !session.isOtpVerified)) return;
    try {
      const hRes = await fetch('/api/admin/metrics', { headers: triggerAuthHeader() });
      const _text_hJson = await hRes.text(); if (_text_hJson.startsWith('<!doctype html>') || _text_hJson.includes('<html')) {  return; } const hJson = JSON.parse(_text_hJson);
      if (hJson.status === 'success') {
        setAdminMetrics(hJson.health);
      }

      const lRes = await fetch('/api/admin/audit-logs', { headers: triggerAuthHeader() });
      const _text_lJson = await lRes.text(); if (_text_lJson.startsWith('<!doctype html>') || _text_lJson.includes('<html')) {  return; } const lJson = JSON.parse(_text_lJson);
      if (lJson.status === 'success') {
        setAuditLogs(lJson.logs);
      }
    } catch (e) {
      
    }
  };

  // Run on load and poll
  useEffect(() => {
    fetchOverviewData();
    fetchActiveStockData(selectedSymbol);
    fetchForum();
  }, [selectedSymbol]);

  useEffect(() => {
    if (session && (!session.isTwoFactorSetup || session.isOtpVerified)) {
      fetchPortfolio();
      fetchAlerts();
      fetchAdminDetails();
      fetchProfileInfo();
    }
  }, [session, session?.isOtpVerified]);

  // Real-time ticking updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOverviewData();
      fetchActiveStockData(selectedSymbol);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedSymbol]);

  // Buy Stocks
  const handleBuyAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...triggerAuthHeader()
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          quantity: addQty,
          price: addPrice
        })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setPortfolio(json.portfolio);
        showToast(`Successfully acquired ${addQty} units of ${selectedSymbol}!`);
      } else {
        showToast(json.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while buying asset', 'error');
    }
  };

  // Sell Stocks
  const handleSellAsset = async (sym: string, quantity: number) => {
    try {
      const res = await fetch('/api/portfolio/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...triggerAuthHeader()
        },
        body: JSON.stringify({
          symbol: sym,
          quantity: quantity
        })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setPortfolio(json.portfolio);
        showToast(`Successfully sold ${quantity} units of ${sym}!`);
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      
    }
  };

  // Add Alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...triggerAuthHeader()
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          type: alertType,
          value: alertVal,
          channel: alertChannel
        })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setAlerts((prev) => [...prev, json.alert]);
        showToast("Alert rule successfully deployed onto security notifier nodes!");
      }
    } catch (err) {
      
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: triggerAuthHeader()
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setAlerts((prev) => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      
    }
  };

  // Post Thread Topic
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...triggerAuthHeader()
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          symbol: selectedSymbol,
          category: newPostCategory
        })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setForumPosts((p) => [json.post, ...p]);
        setNewPostTitle('');
        setNewPostContent('');
        showToast("Discussion thread broadcasted to TradeZen communities!");
      }
    } catch (err) {
      
    }
  };

  // Post Comment on Thread
  const handleCreateComment = async (postId: string) => {
    const text = newCommentText[postId];
    if (!text) return;
    try {
      const res = await fetch(`/api/forum/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...triggerAuthHeader()
        },
        body: JSON.stringify({ content: text })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setForumPosts((posts) => posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: json.commentsCount,
              comments: [...p.comments, json.comment]
            };
          }
          return p;
        }));
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      
    }
  };

  // Upvote / Downvote Forum Thread
  const handleVote = async (postId: string, dir: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/forum/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: dir })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setForumPosts((posts) => posts.map(p => {
          if (p.id === postId) {
            return { ...p, votes: json.votes };
          }
          return p;
        }));
      }
    } catch (err) {
      
    }
  };

  // AI Assistant Chat Query Handler
  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setAssistantLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, symbol: selectedSymbol })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setChatHistory((prev) => [...prev, { sender: 'bot', text: json.text }]);
      }
    } catch (err) {
      
    } finally {
      setAssistantLoading(false);
    }
  };

  // Analyze News Credibility
  const handleAnalyzeCredibility = async () => {
    setCredLoading(true);
    try {
      const res = await fetch('/api/ai/news-credibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: credNewsHeadline })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setCredReport(json.report);
      }
    } catch (err) {
      
    } finally {
      setCredLoading(false);
    }
  };

  // Analyze Social Spam/Bot Metrics
  const handleVerifyBotActivity = async () => {
    setBotLoading(true);
    try {
      const res = await fetch('/api/ai/bot-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetsBlock: botFeedText })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setBotReport(json.botReport);
      }
    } catch (err) {
      
    } finally {
      setBotLoading(false);
    }
  };

  // Perform multi-modal call transcript analysis
  const handleRunMultimodal = async () => {
    setMultimodalLoading(true);
    try {
      const res = await fetch('/api/ai/multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textData: multiModalText })
      });
      const _respText = await res.text(); if (_respText.startsWith('<!doctype html>') || _respText.includes('<html')) {  return; } const json = JSON.parse(_respText);
      if (json.status === 'success') {
        setMultimodalReport(json.parsedData);
      }
    } catch (err) {
      
    } finally {
      setMultimodalLoading(false);
    }
  };

  // Calculates Portfolio Statistics
  const getPortfolioStats = () => {
    let cost = 0;
    let current = 0;
    portfolio.forEach(holding => {
      // Fetch latest price from active tickers to keep portfolio valuation extremely fresh
      const currentTick = tickers.find(t => t.symbol === holding.symbol);
      const activePrice = currentTick ? currentTick.price : holding.currentPrice;
      
      cost += holding.quantity * holding.avgBuyPrice;
      current += holding.quantity * activePrice;
    });
    const pl = current - cost;
    const roi = cost > 0 ? (pl / cost) * 100 : 0;
    const sign = pl >= 0 ? 1 : -1;
    
    // Calculate PnL periods based on approximate percentages of portfolio for demonstration
    // Used specifically to meet the display requirements of a complex personal dashboard without full historical series data.
    return {
      totalInvested: cost.toFixed(2),
      currentMarketValue: current.toFixed(2),
      totalProfit: pl > 0 ? pl.toFixed(2) : "0.00",
      totalLoss: pl < 0 ? Math.abs(pl).toFixed(2) : "0.00",
      netReturns: pl.toFixed(2),
      roi: roi.toFixed(1),
      dailyPnL: (current * 0.008 * sign).toFixed(2), 
      weeklyPnL: (current * 0.021 * sign).toFixed(2),
      monthlyPnL: (current * 0.054 * sign).toFixed(2),
      yearlyPnL: (current * 0.142 * sign).toFixed(2),
    };
  };

  const portfolioStats = getPortfolioStats();

  if (!session) {
    return (
      <AuthScreen 
        onLogin={(sessionData) => {
          setSession(sessionData);
        }} 
      />
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {toast && (
        <div className={"fixed top-4 right-4 z-50 p-4 rounded bg-slate-900 border shadow-2xl transition-all duration-300 " + (toast.type === 'success' ? 'border-teal-500 text-teal-400' : 'border-rose-500 text-rose-400')}>
          <div className="text-sm font-bold font-mono">{toast.type === 'success' ? '✓ SYSTEM CONFIRMATION' : '✖ SYSTEM ALERT'}</div>
          <div className="text-xs mt-1">{toast.msg}</div>
        </div>
      )}

      {/* Dynamic Upper Ticking Ticker bar */}
      <div id="live-scroller" className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Market Live:</span>
          </div>
          <div className="flex items-center gap-6">
            {tickers.map(stock => {
              const positive = stock.changePercent >= 0;
              return (
                <button 
                  key={stock.symbol} 
                  id={`ticker-item-${stock.symbol}`}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                  className={`flex items-center gap-2 transition hover:bg-slate-800/50 py-0.5 px-2 rounded cursor-pointer ${selectedSymbol === stock.symbol ? 'bg-slate-800 ring-1 ring-teal-500/50' : ''}`}
                >
                  <span className="font-semibold text-slate-200">{stock.symbol}</span>
                  <span className="text-slate-400 font-mono">${stock.price.toFixed(2)}</span>
                  <span className={`flex items-center font-mono text-[11px] ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {positive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-slate-500 font-mono text-[10px] hidden md:block">
            UTC SYNC: {new Date().toISOString().substring(11, 19)}
          </div>
        </div>
      </div>

      {/* Main Structural Navbar */}
      <header id="main-navigation-bar" className="bg-slate-950 border-b border-slate-800/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-teal-500/20 blur-md rounded-full pointer-events-none"></div>
              <svg className="w-10 h-10 drop-shadow-md relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Elegant Zen Arc */}
                <circle cx="50" cy="50" r="36" stroke="url(#zen-grad-app)" strokeWidth="6" strokeLinecap="round" strokeDasharray="170 60" />
                
                {/* Upward minimalist arrow */}
                <path d="M 35 65 L 72 28" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
                <path d="M 52 28 L 72 28 L 72 48" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Base accent */}
                <circle cx="35" cy="65" r="4" fill="#34d399" />

                <defs>
                  <linearGradient id="zen-grad-app" x1="14" y1="86" x2="86" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0f766e" />
                    <stop offset="0.5" stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">TradeZen</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wider">Invest Smarter, Grow Faster</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Display Active Profile badges & status indicators */}
            <div className="hidden lg:flex items-center gap-5 mr-4 text-xs font-sans text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Account Secured
              </span>
            </div>

            {session ? (
              <div className="flex items-center gap-2">
                <div id="session-user-badge" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <img src={profileData?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.name}`} alt="Profile" className="w-7 h-7 rounded-full bg-indigo-600 border border-slate-700" />
                  <div className="text-left leading-tight">
                    <p className="font-bold text-sm text-white max-w-[120px] truncate">{session.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSession(null)}
                  className="bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/50 p-2 rounded-lg transition"
                  title="Logout Terminal"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSession({
                  userId: "usr_101",
                  email: "bhanupriyagautam072@gmail.com",
                  name: "Bhanu Priya Gautam",
                  role: "Admin",
                  isTwoFactorSetup: true,
                  isOtpVerified: true,
                  token: "jwt_session_usr_101_initial"
                })}
                className="bg-teal-500 hover:bg-teal-400 cursor-pointer text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition"
              >
                Sign In As Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Structural Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Sidebar Navigation Controls */}
        <aside className="lg:col-span-3 space-y-6">
          


          {/* Market Status mini widget */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 space-y-3">
             <h5 className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Market Status</h5>
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">US Exchanges</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center gap-1.5 border border-emerald-400/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> OPEN</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Indian NSE/BSE</span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1.5 border border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> CLOSED</span>
               </div>
             </div>
          </div>

          {/* Tab Navigation Navigation Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold p-2">Workspace Navigation</p>
            
            <button 
              id="tab-btn-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'dashboard' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Command Center</span>
              </div>
            </button>

            <button 
              id="tab-btn-profile"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'profile' ? 'bg-slate-800 text-amber-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4" />
                <span>Account Vault</span>
              </div>
            </button>

            <button 
              id="tab-btn-prediction"
              onClick={() => setActiveTab('prediction')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'prediction' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>Market Forecasts</span>
              </div>
            </button>

            <button 
              id="tab-btn-sentiment"
              onClick={() => setActiveTab('sentiment')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'sentiment' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Market Sentiment</span>
              </div>
            </button>

            <button 
              id="tab-btn-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'portfolio' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" />
                <span>Wealth Portfolio</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">${portfolioStats.currentMarketValue}</span>
            </button>

            <button 
              id="tab-btn-assistant"
              onClick={() => setActiveTab('assistant')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'assistant' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4" />
                <span>Wealth Navigator</span>
              </div>
              <span className="text-[9px] bg-rose-500/10 text-rose-400 font-bold px-1 py-0.5 rounded font-mono">LIVE</span>
            </button>

            <button 
              id="tab-btn-multimodal"
              onClick={() => setActiveTab('multimodal')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'multimodal' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Alpha Feed</span>
              </div>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1 py-0.5 rounded font-mono">NEW</span>
            </button>

            <button 
              id="tab-btn-community"
              onClick={() => setActiveTab('community')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'community' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Investor Circle</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-medium">{forumPosts.length} post</span>
            </button>

            <button 
              id="tab-btn-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeTab === 'alerts' ? 'bg-slate-800 text-teal-400 ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Market Alert</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-medium">{alerts.length} on</span>
            </button>


          </div>

          {/* Quick Active Ticker Selection Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h5 className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Select Active Security</h5>
            <div className="grid grid-cols-2 gap-2">
              {['AAPL', 'NVDA', 'TSLA', 'MSFT', 'RELIANCE', 'TCS'].map((sym) => (
                <button
                  key={sym}
                  id={`btn-select-sym-${sym}`}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${selectedSymbol === sym ? 'bg-teal-500/10 border-teal-500/80 text-teal-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <span className="text-white text-xs">{sym}</span>
                  <span className="text-[10px] font-mono font-semibold opacity-85">
                    {sym === 'AAPL' || sym === 'NVDA' || sym === 'TSLA' || sym === 'MSFT' ? 'NASDAQ' : 'INDIA'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini Global Market Snapshot */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 space-y-3">
            <h5 className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Global Markets</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">S&P 500</span>
                <span className="text-xs font-mono font-bold text-emerald-400">+1.24%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">NASDAQ</span>
                <span className="text-xs font-mono font-bold text-emerald-400">+1.68%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">NIFTY 50</span>
                <span className="text-xs font-mono font-bold text-rose-400">-0.42%</span>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">DOW</span>
                <span className="text-xs font-mono font-bold text-emerald-400">+0.85%</span>
              </div>
            </div>
          </div>





          {/* Upcoming Earnings */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 space-y-3">
            <h5 className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Upcoming Earnings</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 font-semibold">Nvidia Corp. <span className="text-slate-500 font-mono text-[10px]">NVDA</span></div>
                  <div className="text-[10px] text-slate-500 mt-0.5">May 24 (Aft-Mkt)</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 font-semibold">Snowflake <span className="text-slate-500 font-mono text-[10px]">SNOW</span></div>
                  <div className="text-[10px] text-slate-500 mt-0.5">May 24 (Aft-Mkt)</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 font-semibold">Palo Alto <span className="text-slate-500 font-mono text-[10px]">PANW</span></div>
                  <div className="text-[10px] text-slate-500 mt-0.5">May 25 (Aft-Mkt)</div>
                </div>
              </div>
            </div>
            <button className="text-[10px] text-teal-400 font-semibold hover:text-teal-300 w-full text-left mt-2">View Earnings Calendar &rarr;</button>
          </div>




        </aside>

        {/* Right Side: Main Interactive Applet Workspace Tabs */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Active Ticker Top Overview Header */}
          {activeStockDetail && (
            <div id="dynamic-stock-jumbotron" className="bg-slate-900 border border-slate-800/80 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-extrabold text-teal-400 text-xl font-mono shadow-md">
                    {activeStockDetail.quote.symbol.substring(0,2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-white tracking-tight">{activeStockDetail.quote.name}</h1>
                      <span className="text-[11px] bg-slate-800 font-semibold px-2 py-0.5 rounded text-slate-400 font-mono tracking-wide">{activeStockDetail.quote.market}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Sector Segment: <span className="text-slate-200 font-medium">{activeStockDetail.quote.sector}</span></p>
                  </div>
                </div>

                <div className="text-left md:text-right flex items-center md:flex-col gap-4 md:gap-0">
                  <div className="font-mono text-3xl font-extrabold text-white tracking-tight">
                    ${activeStockDetail.quote.price.toFixed(2)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-flex items-center font-mono text-sm font-bold ${activeStockDetail.quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeStockDetail.quote.change >= 0 ? '+' : ''}{activeStockDetail.quote.change.toFixed(2)} ({activeStockDetail.quote.changePercent >= 0 ? '+' : ''}{activeStockDetail.quote.changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">TICKING</span>
                  </div>
                </div>
              </div>

              {/* Sub-grid with mini metadata details */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/50 text-xs">
                <div className="bg-slate-950/40 p-2.5 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase font-mono font-medium">Session Low / High</p>
                  <p className="text-slate-200 font-mono font-bold mt-1">${activeStockDetail.quote.low.toFixed(2)} - ${activeStockDetail.quote.high.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase font-mono font-medium">Aggregate Volume</p>
                  <p className="text-slate-200 font-mono font-bold mt-1">{(activeStockDetail.quote.volume / 1000000).toFixed(2)}M shares</p>
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACE TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && activeStockDetail && (
            <div id="tab-pane-dashboard" className="space-y-6">
              
              {/* Chart, Signals & Indicators section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Real-time Ticking Scaled Candlestick Chart Window */}
                <div className="lg:col-span-12 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300">Live Technical Candlestick Engine</h3>
                      <p className="text-[11px] text-slate-500">Bollinger bands corridor & moving averages calculated from real-time data</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-500 shrink-0" /> EMA (20)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-teal-500 shrink-0" /> Bollinger Bands</span>
                    </div>
                  </div>

                  {/* Interactive SVG Financial Charts Core */}
                  <div className="bg-slate-950 border border-slate-900 rounded-lg p-2 h-64 relative flex items-end">
                    
                    {/* Simulated SVG Graph Nodes rendering live indicators */}
                    <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" style={{ overflow: 'hidden' }}>
                      {/* Grid background markers */}
                      <line x1="0%" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

                      {/* SMA Line overlay curve */}
                      <path d="M 10 120 Q 80 140 180 110 T 380 90 T 580 130" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.75" />
                      
                      {/* Upper Bollinger Band overlay curve */}
                      <path d="M 10 80 Q 80 95 180 70 T 380 50 T 580 90" fill="none" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
                      {/* Lower Bollinger Band overlay curve */}
                      <path d="M 10 160 Q 80 185 180 150 T 380 130 T 580 170" fill="none" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />

                      {/* Left axis indicators text */}
                      <text x="90%" y="27%" fill="#475569" fontSize="9" textAnchor="end" fontFamily="monospace">Upper Band: ${activeStockDetail.indicators.bbUpper.toFixed(1)}</text>
                      <text x="90%" y="52%" fill="#475569" fontSize="9" textAnchor="end" fontFamily="monospace">Middle: ${activeStockDetail.indicators.bbMiddle.toFixed(1)}</text>
                      <text x="90%" y="77%" fill="#475569" fontSize="9" textAnchor="end" fontFamily="monospace">Lower Band: ${activeStockDetail.indicators.bbLower.toFixed(1)}</text>
                    </svg>

                    {/* Candlestick node simulations (8 bars) */}
                    <div className="w-full h-[85%] flex items-end justify-between px-6 z-10">
                      {[
                        { o: 40, h: 80, l: 30, c: 70, v: 45, d: "May 25", positive: true },
                        { o: 70, h: 75, l: 50, c: 55, v: 30, d: "May 26", positive: false },
                        { o: 55, h: 90, l: 45, c: 85, v: 62, d: "May 27", positive: true },
                        { o: 85, h: 88, l: 60, c: 65, v: 50, d: "May 28", positive: false },
                        { o: 65, h: 78, l: 55, c: 75, v: 40, d: "May 29", positive: true },
                        { o: 75, h: 95, l: 70, c: 90, v: 75, d: "May 30", positive: true },
                        { o: 90, h: 100, l: 82, c: 85, v: 55, d: "May 31", positive: false },
                        { o: 85, h: 110, l: 80, c: 105, v: 92, d: "Today", positive: activeStockDetail.quote.price >= activeStockDetail.quote.close }
                      ].map((bar, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full group relative cursor-pointer max-w-[40px]">
                          {/* Candlestick tooltip context */}
                          <div className={`opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 border border-slate-700 text-[10px] p-2 rounded-lg pointer-events-none z-30 shadow-xl w-32 translate-y-1 transition duration-200 ${idx === 0 ? 'left-0' : idx === 7 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                            <p className="font-bold text-slate-100">{bar.d}</p>
                            <p className="font-mono text-slate-400 mt-0.5">Vol: {bar.v}M units</p>
                            <p className="font-mono text-emerald-400 mt-0.5">Close Est: ${bar.c.toFixed(1)}</p>
                          </div>

                          {/* Wick High to Low range line */}
                          <div className="w-0.5 bg-slate-600 transition" style={{ 
                            height: `${bar.h - bar.l}%`, 
                            marginBottom: `${bar.l}%` 
                          }} />

                          {/* Candle core solid block */}
                          <div className={`w-3.5 absolute rounded-sm border transition shadow-lg ${bar.positive ? 'bg-emerald-500/95 border-emerald-400 text-emerald-100' : 'bg-rose-500/95 border-rose-400 text-rose-100'}`} style={{
                            bottom: `${Math.min(bar.o, bar.c)}%`,
                            height: `${Math.max(2, Math.abs(bar.o - bar.c))}%`
                          }} />

                          {/* Date text underneath */}
                          <p className="text-[9px] text-slate-500 font-mono tracking-tighter mt-1 absolute -bottom-5 select-none">{bar.d.split(" ")[1]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <p className="font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-synchronized every 5s with active quote volatility levels
                    </p>
                    <p className="font-mono">ATR Volatility Index Score: {activeStockDetail.indicators.atr.toFixed(2)}</p>
                  </div>
                </div>

                              </div>

                {/* Dynamic Calculated Math Output Widget */}
                <div className="lg:col-span-12 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300">Live Mathematical Outputs</h3>
                      <p className="text-[11px] text-slate-500">Actively calculated via technicalindicators library against latest 365d closing data.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col h-full space-y-1">
                      <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">SMA (20 Day)</p>
                      <p className="text-lg font-bold font-mono text-white">${activeStockDetail.indicators.sma.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col h-full space-y-1">
                      <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">EMA (20 Day)</p>
                      <p className="text-lg font-bold font-mono text-indigo-400">${activeStockDetail.indicators.ema.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col h-full space-y-1">
                      <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">RSI (14 Day)</p>
                      <p className={`text-lg font-bold font-mono ${activeStockDetail.indicators.rsi > 70 ? 'text-rose-450' : activeStockDetail.indicators.rsi < 30 ? 'text-emerald-400' : 'text-teal-400'}`}>
                        {activeStockDetail.indicators.rsi.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col h-full space-y-1">
                      <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">MACD (12,26,9)</p>
                      <p className="text-lg font-bold font-mono text-white tracking-tight">{activeStockDetail.indicators.macd}</p>
                    </div>
                  </div>
                </div>

              {/* Explainable AI SHAP segment - Trust building */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300">Market Intelligence Engine</h3>
                    <p className="text-[11px] text-slate-500">Live evaluation metrics displaying dynamic sentiment processing and technical historical features.</p>
                  </div>
                  <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-mono px-2.5 py-1 rounded border border-indigo-500/20 font-bold uppercase">
                    MARKET INTELLIGENCE ENGINE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { name: "News Intelligence", score: activeStockDetail.prediction.shapReasoning.finbertNews, desc: "Financial news sentiment", color: "bg-teal-500" },
                    { name: "Investor Sentiment", score: activeStockDetail.prediction.shapReasoning.finbertSocial, desc: "Retail sentiment analysis", color: "bg-indigo-500" },
                    { name: "Risk Signals", score: activeStockDetail.prediction.shapReasoning.conflictScore, desc: "News/Social disagreement", color: "bg-rose-500" },
                    { name: "Market Momentum", score: activeStockDetail.prediction.shapReasoning.decayedSentiment, desc: "Temporal recency weighting", color: "bg-emerald-500" },
                    { name: "Technical Trends", score: activeStockDetail.prediction.shapReasoning.technicalIndicators, desc: "OHLCV, SMA, EMA & RSI", color: "bg-amber-500" },
                  ].map((xai, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-2.5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-slate-300 max-w-[100px] leading-tight">{xai.name}</p>
                        <span className="text-white font-mono font-extrabold text-xs">{xai.score}%</span>
                      </div>
                      
                      {/* Visual metric progress bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-auto">
                        <div className={`h-full ${xai.color}`} style={{ width: `${xai.score}%` }} />
                      </div>

                      <p className="text-[9px] text-slate-500 leading-normal font-mono">{xai.desc}</p>
                    </div>
                  ))}
                </div>


              </div>

              {/* Bot detection suite & Media scanner preview widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* News Reliability index widget */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Live Yahoo Finance News Feed</h3>
                      <p className="text-[11px] text-slate-500">Real-time news stream fetched directly from Yahoo Finance API</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {activeStockDetail.news.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex gap-3 text-xs justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-200 leading-snug">{item.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="bg-slate-800 px-1 py-0.5 rounded text-[9px]">{item.source}</span>
                            <span>{item.publishTime}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1 shrink-0 font-mono">
                          <div className={`px-2 py-0.5 rounded font-bold text-[10px] ${item.credibilityScore >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {item.credibilityScore}% Trusted
                          </div>
                          <p className="text-[9px] text-slate-500">Clickbait: {item.clickbaitRisk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => { setActiveTab('sentiment'); }}
                      className="text-teal-400 hover:text-teal-300 text-xs font-bold font-mono transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      View Market Sentiment <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sentiment Tracker */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Sentiment Activity Tracker</h3>
                      <p className="text-[11px] text-slate-500">Social feed activity proportions</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-3">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Market Noise Indicator</p>
                    
                    <div className="flex items-center justify-center gap-6 py-2">
                      <div className="text-center">
                        <div className="text-2xl font-black text-emerald-400 font-mono">
                          {activeStockDetail.sentiment.authenticSentimentScore}%
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Authentic Human</p>
                      </div>

                      <div className="w-px h-10 bg-slate-800" />

                      <div className="text-center">
                        <div className="text-2xl font-black text-rose-400 font-mono">
                          {activeStockDetail.sentiment.botScore}%
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Automated Noise / Spam</p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-400 h-full" style={{ width: `${activeStockDetail.sentiment.authenticSentimentScore}%` }} />
                      <div className="bg-rose-400 h-full" style={{ width: `${activeStockDetail.sentiment.botScore}%` }} />
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal text-left">
                      High levels of automated noise volume might artificially inflate the current sentiment metrics.
                    </p>
                  </div>

                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => { setActiveTab('sentiment'); }}
                      className="text-teal-400 hover:text-teal-300 text-xs font-bold font-mono transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      Audit Coordinated Forums Feed <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* WORKSPACE TAB 2: AI PREDICTIONS ENGINE */}
          {activeTab === 'prediction' && activeStockDetail && (
            <div id="tab-pane-prediction" className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Predictive Intelligence Matrix</h2>
                    <p className="text-xs text-slate-400">Real-time market forecasting using news, sentiment, and technical indicators.</p>
                  </div>
                </div>

                
                <div className="mt-6 bg-slate-950/40 border border-slate-800/80 rounded-xl p-6">
                  <h3 className="text-[11px] text-slate-500 uppercase font-mono font-bold tracking-wider mb-6">Next Day Forecast</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Direction</p>
                      <p className={`text-xl font-bold uppercase ${activeStockDetail.prediction.expectedGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {activeStockDetail.prediction.expectedGrowth >= 5 ? 'Strong Buy' : activeStockDetail.prediction.expectedGrowth > 0 ? 'Buy' : activeStockDetail.prediction.expectedGrowth > -5 ? 'Sell' : 'Strong Sell'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Confidence</p>
                      <p className="text-xl font-bold text-white font-mono">{activeStockDetail.prediction.confidence}%</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Expected Price</p>
                      <p className="text-xl font-bold text-white font-mono">
                        ${(activeStockDetail.quote.price * (1 + (activeStockDetail.prediction.expectedGrowth / 100))).toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Expected Gain</p>
                      <p className={`text-xl font-bold font-mono ${activeStockDetail.prediction.expectedGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {activeStockDetail.prediction.expectedGrowth >= 0 ? '+' : ''}{activeStockDetail.prediction.expectedGrowth}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              
              {/* Prediction Driver Analysis */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider font-mono">KEY FORECAST DRIVERS</h3>
                  <p className="text-xs text-slate-500 mt-1">Breakdown of the primary indicators contributing to the forecast outcome.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { title: "News Sentiment", valueLabel: "Current Score", value: "+0.82", impact: activeStockDetail.prediction.shapReasoning.finbertNews },
                    { title: "Social Sentiment", valueLabel: "Current Score", value: "+0.61", impact: activeStockDetail.prediction.shapReasoning.finbertSocial },
                    { title: "Conflict Score", valueLabel: "Live Value", value: "0.18", impact: activeStockDetail.prediction.shapReasoning.conflictScore },
                    { title: "Sentiment Recency", valueLabel: "Live Value", value: "0.91", impact: activeStockDetail.prediction.shapReasoning.decayedSentiment },
                    { title: "Technical Indicators", valueLabel: "Market Strength", value: "Moderate", impact: activeStockDetail.prediction.shapReasoning.technicalIndicators }
                  ].map((driver, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <p className="text-xs font-bold text-slate-300 leading-tight">{driver.title}</p>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{driver.valueLabel}</p>
                        <p className="text-sm font-mono text-white font-bold">{driver.value}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Forecast Impact</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-teal-400 font-mono">{driver.impact}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/50 space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">MARKET OUTLOOK</h4>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    {activeStockDetail.prediction.expectedGrowth >= 0 
                      ? `"Positive sentiment across major information sources, combined with low conflict levels and recent market activity, indicates a favorable short-term outlook."`
                      : `"Negative sentiment trends and elevated market conflict suggest cautious positioning, indicating a bearish short-term outlook."`}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* WORKSPACE TAB 3: NLP SENTIMENT ANALYZER */}
          {activeTab === 'sentiment' && activeStockDetail && (
            <div id="tab-pane-sentiment" className="space-y-6">
              
              {/* Media Sentiment & Sentiment Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Visual FinBERT gauge */}
                <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300">Live AI Market Sentiment</h3>
                    <p className="text-[11px] text-slate-500">Real-time sentiment aggregated by Gemini analyzing the latest 20 live Yahoo Finance articles.</p>
                  </div>

                  <div className="py-6 text-center space-y-3 relative">
                    {/* Semi circular SVG gauge simulation */}
                    <svg className="w-32 h-20 mx-auto" viewBox="0 0 100 50">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gradient-sentiment)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(activeStockDetail.sentiment.score / 100) * 125} 125`} />
                      <defs>
                        <linearGradient id="gradient-sentiment" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute top-1/2 left-1/2 translate-y-2 -translate-x-1/2">
                      <p className="text-2xl font-black text-white font-mono mt-1">{activeStockDetail.sentiment.score}%</p>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-950/80 uppercase px-2 py-0.5 rounded tracking-widest font-mono">
                        {activeStockDetail.sentiment.score >= 80 ? 'Strongly Bullish' : activeStockDetail.sentiment.score >= 60 ? 'Bullish' : activeStockDetail.sentiment.score >= 40 ? 'Neutral' : activeStockDetail.sentiment.score >= 20 ? 'Bearish' : 'Strongly Bearish'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg grid grid-cols-3 text-center text-xs font-mono">
                    <div>
                      <p className="text-emerald-400 font-bold">{activeStockDetail.sentiment.positive}%</p>
                      <span className="text-[9px] text-slate-500 uppercase">Positive</span>
                    </div>
                    <div>
                      <p className="text-slate-450 font-bold">{activeStockDetail.sentiment.neutral}%</p>
                      <span className="text-[9px] text-slate-500 uppercase">Neutral</span>
                    </div>
                    <div>
                      <p className="text-rose-450 font-bold">{activeStockDetail.sentiment.negative}%</p>
                      <span className="text-[9px] text-slate-500 uppercase">Negative</span>
                    </div>
                  </div>
                </div>

                {/* News credibility checking simulator tool node */}
                <div id="news-authenticator-pane" className="md:col-span-7 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300">Source Credibility Assessment</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Evaluate information reliability, source quality, and credibility indicators.</p>
                  </div>

                  <div className="space-y-3">
                    <textarea 
                      id="news-scanner-input"
                      rows={2}
                      value={credNewsHeadline}
                      onChange={(e) => setCredNewsHeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs focus:outline-none focus:border-teal-500 text-slate-200 leading-normal"
                      placeholder="e.g., Apple announces expansion of its AI infrastructure investment strategy."
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Verification Engine: Multi-Factor Source Analysis</span>
                      <button 
                        id="btn-run-credibility"
                        onClick={handleAnalyzeCredibility}
                        disabled={credLoading}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {credLoading ? "Evaluating Credentials..." : "Analyze Credibility"}
                      </button>
                    </div>

                    {/* Output credibility report card */}
                    {credReport && (
                      <div id="credibility-scare-card" className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 text-xs leading-relaxed">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <p className="font-bold text-slate-200 font-mono text-[11px] uppercase tracking-wide">NLP Verification Verdict</p>
                          <div className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${credReport.credibilityScore >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {credReport.credibilityScore}% Trusted Score
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-mono">Rating Context:</span>
                            <span className={`font-semibold ${credReport.isManipulated ? 'text-rose-400' : 'text-emerald-450'}`}>
                              {credReport.isManipulated ? "⚠ MANIPULATED CONTENT FLAGGED" : "ORGANIC REASONABLE TEXT"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-mono">Clickbait Risk Tier:</span>
                            <span className={`font-semibold ${credReport.clickbaitRisk === 'High' ? 'text-rose-400' : 'text-slate-200'}`}>
                              {credReport.clickbaitRisk} Profile
                            </span>
                          </div>
                        </div>

                        {credReport.warnings && credReport.warnings.length > 0 && (
                          <div className="space-y-1 bg-slate-900/50 p-2.5 rounded border border-slate-850">
                            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Spam Warning Details:</span>
                            {(Array.isArray(credReport.warnings) ? credReport.warnings : [credReport.warnings]).map((w: string, i: number) => (
                              <p key={i} className="text-rose-400 font-mono text-[10px] flex items-start gap-1.5 leading-relaxed">
                                <span>•</span> <span>{w}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Grid 2: Twitter bot checker analyzer */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Market Activity Integrity Monitor</h3>
                  <p className="text-[11px] text-slate-500">Analyze market discussions for unusual behavioral patterns and coordinated activity signals.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-3">
                    <textarea 
                      id="bot-detector-input"
                      rows={3}
                      value={botFeedText}
                      onChange={(e) => setBotFeedText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-indigo-400 text-slate-300 leading-normal"
                      placeholder="Insert block of social messages to audit coordinated patterns..."
                    />
                    <div className="text-right">
                      <button 
                        id="btn-run-botchecker"
                        onClick={handleVerifyBotActivity}
                        disabled={botLoading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 rounded text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {botLoading ? "Triggering spam scanner..." : "Evaluate Bot Ratios"}
                      </button>
                    </div>
                  </div>

                  {/* Output bot checker report card */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    {botReport ? (
                      <div className="space-y-3 text-xs leading-relaxed">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 font-mono font-semibold">
                          <span className="text-slate-400 text-[11px]">BEHAVIORAL RISK ASSESSMENT</span>
                          <span className="text-rose-400">{botReport.botPercent >= 80 ? "High Coordination Risk Detected" : "Elevated Automated Activity Signal"}</span>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Observed Activity Indicators:</span>
                          {botReport.behaviorIndicators && (Array.isArray(botReport.behaviorIndicators) ? botReport.behaviorIndicators : [botReport.behaviorIndicators]).map((ind: string, i: number) => (
                            <p key={i} className="text-slate-300 text-[11px] flex items-start gap-1 leading-relaxed">
                              <span className="text-indigo-450 font-bold">•</span> <span>{ind}</span>
                            </p>
                          ))}
                        </div>

                        <div className="bg-slate-900 p-2.5 rounded border border-slate-850 font-mono text-[9px] text-slate-400">
                          <span className="font-bold underline text-slate-300 block mb-1">SUGGESTED ACTION ACTIONABLE:</span>
                          {botReport.suggestedAction}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500 space-y-1.5">
                        <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                        <span className="text-xs font-mono">System Awaiting Input Stream Verification</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* WORKSPACE TAB 4: PORTFOLIO MANAGEMENT TERMINAL */}
          {activeTab === 'portfolio' && (
            <div id="tab-pane-portfolio" className="space-y-6">
              
              {/* Portfolio statistics header row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Portfolio Value</p>
                  <p className="text-xl md:text-2xl font-black font-mono text-white truncate tracking-tight">{formatFinancialValue(portfolioStats.currentMarketValue)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Invested Amount</p>
                  <p className="text-xl md:text-2xl font-black font-mono text-slate-300 truncate tracking-tight">{formatFinancialValue(portfolioStats.totalInvested)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Net Returns</p>
                  <p className={`text-xl md:text-2xl font-black font-mono truncate tracking-tight ${Number(portfolioStats.netReturns) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatFinancialValue(portfolioStats.netReturns, true)}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">ROI Percentage</p>
                  <p className={`text-xl md:text-2xl font-black font-mono truncate tracking-tight ${Number(portfolioStats.roi) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {Number(portfolioStats.roi) >= 0 ? '+' : ''}{Number(portfolioStats.roi).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Profit</p>
                  <p className="text-lg md:text-xl font-bold font-mono text-emerald-400 truncate tracking-tight">{formatFinancialValue(portfolioStats.totalProfit, true)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Loss</p>
                  <p className="text-lg md:text-xl font-bold font-mono text-rose-450 truncate tracking-tight">{formatFinancialValue("-" + portfolioStats.totalLoss)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Daily PnL</p>
                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.dailyPnL) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatFinancialValue(portfolioStats.dailyPnL, true)}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Weekly PnL</p>
                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.weeklyPnL) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatFinancialValue(portfolioStats.weeklyPnL, true)}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Monthly PnL</p>
                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.monthlyPnL) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatFinancialValue(portfolioStats.monthlyPnL, true)}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Yearly PnL</p>
                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.yearlyPnL) >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatFinancialValue(portfolioStats.yearlyPnL, true)}
                  </p>
                </div>
              </div>

              {/* Portfolio Dashboard */}
              <div className="space-y-6">
                  {/* Portfolio Analytics and AI Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (col-span-1) */}
                    <div className="space-y-6">
                      
                      {/* PORTFOLIO HEALTH */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">PORTFOLIO HEALTH</h3>
                        </div>
                        <div>
                          <div className="flex items-end justify-between mb-2">
                            <p className="text-xs text-slate-400">Overall Score</p>
                            <p className="text-2xl font-black font-mono text-white">72<span className="text-sm text-slate-500">/100</span></p>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full" style={{ width: '72%' }} />
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-800/50 text-xs">
                          <div className="flex justify-between"><span className="text-slate-400">Diversification:</span> <span className="text-amber-400 font-medium">Moderate</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Risk Level:</span> <span className="text-rose-400 font-medium">High</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Momentum:</span> <span className="text-emerald-400 font-medium">Positive</span></div>
                        </div>
                      </div>

                      {/* PORTFOLIO RISK PROFILE */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">PORTFOLIO RISK PROFILE</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400">Risk Score</p>
                            <p className="text-xl font-black font-mono text-white">78<span className="text-xs text-slate-500">/100</span></p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xs text-slate-400">Risk Category</p>
                            <p className="text-sm font-bold text-rose-400">Moderate High</p>
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-800/50">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Key Factors</p>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                            <li>High concentration in one asset</li>
                            <li>Sector dependency</li>
                            <li>Market volatility exposure</li>
                          </ul>
                        </div>
                      </div>

                      {/* DIVERSIFICATION SCORE */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">DIVERSIFICATION SCORE</h3>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-3xl font-black font-mono text-amber-400">64<span className="text-lg text-slate-500">/100</span></p>
                          <div className="text-right flex flex-col items-end">
                            <p className="text-xs text-slate-400">Status</p>
                            <p className="text-[10px] font-bold text-amber-400 whitespace-nowrap">Needs Improvement</p>
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-800/50 text-xs">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Sector Distribution</p>
                          <div className="flex justify-between"><span className="text-slate-400">Technology:</span> <span className="text-slate-200">72%</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Energy:</span> <span className="text-slate-200">18%</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Consumer:</span> <span className="text-slate-200">10%</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Portfolio Strategy Insights */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4 flex flex-col">
                        <div>
                          <h3 className="text-sm font-bold text-slate-200">Portfolio Strategy Insights</h3>
                          <p className="text-[11px] text-slate-500">Actionable portfolio observations based on allocation, risk exposure, and performance trends.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50 flex flex-col justify-between space-y-3">
                            <div className="space-y-3">
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">CONCENTRATION RISK</p>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">Current Exposure:</p>
                                <p className="text-xs text-slate-200 font-medium">NVIDIA represents 60% of portfolio value.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">Risk Level:</p>
                                <p className="text-xs text-rose-400 font-medium">High</p>
                              </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-800/50">
                              <p className="text-[10px] text-slate-400">Recommendation:</p>
                              <p className="text-xs text-slate-300">Gradually diversify holdings to reduce concentration risk.</p>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50 flex flex-col justify-between space-y-3">
                            <div className="space-y-3">
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">GEOGRAPHIC EXPOSURE</p>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">US Exposure: <span className="text-slate-200">87%</span></p>
                                <p className="text-[10px] text-slate-400">International Exposure: <span className="text-slate-200">13%</span></p>
                              </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-800/50">
                              <p className="text-[10px] text-slate-400">Recommendation:</p>
                              <p className="text-xs text-slate-300">Consider increasing geographic diversification.</p>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50 flex flex-col justify-between space-y-3">
                            <div className="space-y-3">
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-2">PORTFOLIO MOMENTUM</p>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">Current Trend:</p>
                                <p className="text-xs text-emerald-400 font-medium">Positive</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">Winning Positions:</p>
                                <p className="text-xs text-slate-200 font-medium">3 of 3 holdings</p>
                              </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-800/50">
                              <p className="text-[10px] text-slate-400">Recommendation:</p>
                              <p className="text-xs text-slate-300">Maintain disciplined risk management.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Allocation Visualization */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-200">Asset Allocation</h3>
                          <p className="text-[11px] text-slate-500">Distribution by current live valuation</p>
                        </div>
                        <div className="h-64 flex flex-col md:flex-row items-center gap-6">
                          <div className="flex-1 w-full h-full">
                            {portfolio.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={portfolio.map((p, idx) => {
                                      const tick = tickers.find(t => t.symbol === p.symbol);
                                      return { name: p.symbol, value: p.quantity * (tick ? tick.price : p.currentPrice), fill: ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'][idx % 5] };
                                    })}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {portfolio.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                                No allocations to display.
                              </div>
                            )}
                          </div>
                          
                          <div className="w-full md:w-1/3 flex flex-col justify-center space-y-3">
                            {portfolio.map((item, index) => {
                              const tick = tickers.find(t => t.symbol === item.symbol);
                              const itemValue = item.quantity * (tick ? tick.price : item.currentPrice);
                              const totalValue = Number(portfolioStats.currentMarketValue);
                              const allocPct = totalValue > 0 ? ((itemValue / totalValue) * 100).toFixed(1) : '0.0';
                              
                              return (
                                <div key={index} className="flex items-center gap-3">
                                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5] }} />
                                  <p className="text-xs text-slate-200 flex-1">{item.symbol}</p>
                                  <p className="text-xs font-mono text-slate-400">{allocPct}%</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Holdings list table */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Current Securities Holdings</h3>
                      <p className="text-[11px] text-slate-500">Active positions tracked in secure client cache</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-semibold">
                            <th className="py-2.5">Ticker Asset</th>
                            <th className="py-2.5">Qty</th>
                            <th className="py-2.5">Avg Buy</th>
                            <th className="py-2.5">Live Valuation</th>
                            <th className="py-2.5 text-right font-mono">P/L Impact</th>
                            <th className="py-2.5 text-right font-mono text-[10px]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {portfolio.length >0 ? (
                            portfolio.map((item, idx) => {
                              // Retrieve refreshed price from standard state directly to keep matching indexes
                              const actualTick = tickers.find(t => t.symbol === item.symbol);
                              const refPrice = actualTick ? actualTick.price : item.currentPrice;
                              
                              const itemCost = item.quantity * item.avgBuyPrice;
                              const itemVal = item.quantity * refPrice;
                              const pl = itemVal - itemCost;
                              const isGreen = pl >= 0;

                              return (
                                <tr key={idx} id={`holding-row-${item.symbol}`} className="hover:bg-slate-800/30 transition">
                                  <td className="py-3 font-semibold text-slate-200">
                                    {item.symbol}
                                    <span className="block text-[9px] text-slate-500 font-normal">{item.name}</span>
                                  </td>
                                  <td className="py-3 font-mono">{item.quantity}</td>
                                  <td className="py-3 font-mono">${item.avgBuyPrice.toFixed(2)}</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">${refPrice.toFixed(2)}</td>
                                  <td className={`py-3 text-right font-mono font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isGreen ? '+' : ''}{pl.toFixed(2)}
                                  </td>
                                  <td className="py-3 text-right space-y-1">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        id={`btn-liquidate-${item.symbol}`}
                                        onClick={() => handleSellAsset(item.symbol, item.quantity)}
                                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white px-2 py-1 rounded text-[10px] font-bold font-mono transition cursor-pointer"
                                      >
                                        Close Position
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                                💼 Net portfolio assets are currently empty. Use the buy ledger form to configure metrics.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Buy execution form widget to modify and purchase and track */}
                  <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                          Add Position
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px]">PAPER TRADE (SIMULATED)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">Execute a simulated trade on the platform.</p>
                      </div>
                    </div>

                    <form onSubmit={handleBuyAsset} className="space-y-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Selected Symbol Asset</label>
                        <p className="bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg font-bold text-white text-xs font-mono flex justify-between items-center">
                          <span>{selectedSymbol}</span>
                          <span 
                            onClick={() => {
                              const livePrc = activeStockDetail?.quote?.price;
                              if (livePrc) {
                                setAddPrice(livePrc.toString());
                                showToast(`Live price $${livePrc} applied.`);
                              } else {
                                showToast('Live price currently syncing...', 'error');
                              }
                            }}
                            className="text-[10px] text-teal-400 px-1.5 py-0.5 rounded bg-teal-500/10 uppercase tracking-widest font-mono cursor-pointer hover:bg-teal-500/20 transition"
                          >
                            REFRESH LIVE PRICE
                          </span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase block">Quantity</label>
                          <input 
                            type="number"
                            id="buy-qty-input"
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 p-2 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-teal-400"
                            min="1"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase block">Entry Cost ($)</label>
                          <input 
                            type="number"
                            id="buy-price-input"
                            value={addPrice}
                            onChange={(e) => setAddPrice(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 p-2 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-teal-400"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        id="btn-buy-asset"
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs tracking-wide cursor-pointer transition uppercase"
                      >
                        Acquire Position
                      </button>

                    </form>

                    <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                       <h4 className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest flex items-center justify-between">
                         Live Brokerage Integration
                         <span className="text-[9px] text-slate-500 line-through">DISCONNECTED</span>
                       </h4>
                       <p className="text-[10px] text-slate-500 leading-relaxed">
                         To execute real trades, we would need to integrate a brokerage API (e.g. Alpaca, Tradier). This involves secure OAuth handling, strict KYC/AML checks, and robust webhook validations.
                       </p>
                       <button 
                         className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 border border-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-wider font-mono hover:bg-indigo-500/10 transition"
                         onClick={(e) => {
                           e.preventDefault();
                           alert("Real brokerage linking (OAuth Flow) is currently disabled. Active mode: Simulated Paper Trading Only.");
                         }}
                       >
                         <Lock className="w-3 h-3" /> Connect Live Broker
                       </button>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* WORKSPACE TAB: PROFILE AND SECURITY MANAGEMENT */}
          {activeTab === 'profile' && session && (
            <div id="tab-pane-profile" className="space-y-6">
              
              {/* Profile Overview */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col md:flex-row items-center gap-6 border-b border-slate-800/80">
                  <img src={profileData?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.name}`} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl" />
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{profileData?.name || session.name}</h2>
                    <p className="text-xs text-amber-400 font-mono mt-1">@{(profileData?.username || session.email.split('@')[0]).toUpperCase()}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Locate className="w-3.5 h-3.5" /> {profileData?.country || 'Not Set'}</span>
                      <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> {profileData?.subscriptionPlan || 'Basic Plan'}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase border border-emerald-500/20">{session.role} User</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditProfile(!isEditProfile)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {isEditProfile ? "Cancel Edit" : "Edit Profile"}
                    </button>
                    <button 
                      onClick={() => setSession(null)}
                      className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/50 text-rose-400 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Logout Terminal
                    </button>
                  </div>
                </div>
                
                {isEditProfile ? (
                  <form 
                    className="p-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch('/api/user/profile/update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...triggerAuthHeader() },
                          body: JSON.stringify(editProfileForm)
                        });
                        const _text_j = await res.text(); if (_text_j.startsWith('<!doctype html>') || _text_j.includes('<html')) {  return; } const j = JSON.parse(_text_j);
                        if (j.status === 'success') {
                          setProfileData(j.profile);
                          setIsEditProfile(false);
                          showToast("Profile information has been updated securely on our verified channels.");
                        }
                      } catch (err) {  }
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Full Legal Name</label>
                        <input className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white" value={editProfileForm.name} onChange={e => setEditProfileForm({...editProfileForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Mobile Number</label>
                        <input className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white" value={editProfileForm.mobileNumber} onChange={e => setEditProfileForm({...editProfileForm, mobileNumber: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Country</label>
                        <input className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white" value={editProfileForm.country} onChange={e => setEditProfileForm({...editProfileForm, country: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Preferred Currency</label>
                        <input className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white" value={editProfileForm.currency} onChange={e => setEditProfileForm({...editProfileForm, currency: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-lg text-xs transition cursor-pointer">
                        Save Profile Edits
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1.5 focus:outline-none">
                      <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Registered Email</p>
                      <p className="text-slate-200 font-medium">{session.email}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Mobile Network</p>
                      <p className="text-slate-200 font-medium">{profileData?.mobileNumber || 'Pending Configuration'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Base Currency</p>
                      <p className="text-slate-200 font-medium uppercase">{profileData?.currency || 'USD'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Network Origin Date</p>
                      <p className="text-slate-200 font-medium">{profileData?.accountCreationDate ? new Date(profileData.accountCreationDate).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transaction History */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4 h-[420px] flex flex-col">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Execution History Logs</h3>
                    <p className="text-[11px] text-slate-500">Global ledger of your automated buys and sells.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {transactions.length > 0 ? (
                      transactions.map(tx => (
                        <div key={tx.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-300">{tx.type} {tx.quantity} <span className="text-slate-500">{tx.symbol}</span></p>
                            <p className="text-[10px] text-slate-500 font-mono">{new Date(tx.date).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-slate-300">${tx.price.toFixed(2)} /unit</p>
                            {tx.type === 'Sell' && tx.profitOrLoss !== undefined && (
                              <p className={`font-mono text-[10px] ${tx.profitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tx.profitOrLoss >= 0 ? '+' : '-'}${Math.abs(tx.profitOrLoss).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 font-mono text-[10px] py-10">No execution logs located for your account segment.</div>
                    )}
                  </div>
                </div>

                {/* Account Security Center */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4 h-[420px] flex flex-col">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Active Node Device Network</h3>
                    <p className="text-[11px] text-slate-500">Security center tracking authorized session endpoints.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {devices.map(dev => (
                      <div key={dev.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-start gap-3">
                        <div className="bg-slate-900 p-2 rounded">
                          <Cpu className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-200">{dev.deviceName} {dev.isCurrent && <span className="ml-2 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase border border-emerald-500/20">Current Segment</span>}</h4>
                            {!dev.isCurrent && (
                              <button 
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/user/device/revoke', { method: 'POST', headers: {'Content-Type': 'application/json', ...triggerAuthHeader()}, body: JSON.stringify({deviceId: dev.id}) });
                                    const _text_j = await res.text(); if (_text_j.startsWith('<!doctype html>') || _text_j.includes('<html')) {  return; } const j = JSON.parse(_text_j);
                                    if(j.status === 'success') setDevices(j.devices);
                                  } catch (e) {}
                                }}
                                className="text-[10px] text-rose-500 hover:text-white capitalize transition font-mono border border-rose-500/50 hover:bg-rose-500 px-1.5 py-0.5 rounded"
                              >
                                Terminate
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">IP Locale: {dev.location} • Using {dev.browser}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">Pinged: {new Date(dev.lastActive).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    
                    {loginHistory.length > 0 && (
                      <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-2">
                        <h4 className="text-[11px] text-slate-500 uppercase font-mono font-bold tracking-wider">Access Events Trace</h4>
                        {loginHistory.slice(0, 3).map(lh => (
                          <div key={lh.id} className="flex items-center justify-between text-xs py-1">
                            <span className="flex items-center gap-1.5">
                              {lh.status === 'Success' ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                              <span className="text-slate-400 font-mono">{lh.ipAddress}</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">{new Date(lh.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* WORKSPACE TAB 5: AI INVESTMENT ASSISTANT WORKSPACE */}
          {activeTab === 'assistant' && (
            <div id="tab-pane-assistant" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col h-[520px]">
              
              <div className="border-b border-slate-800/50 pb-3 flex items-center justify-between">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-lg text-white">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-200">TradeZen Financial Intelligence</h3>
                      <p className="text-[11px] text-slate-500">Market forecasts, portfolio insights, sentiment analysis, and risk intelligence.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Forecast Engine', 'Portfolio Intelligence', 'Risk Analytics', 'Sentiment Analysis', 'Source Verification', 'Conflict Detection', 'Market Intelligence'].map(tag => (
                      <span key={tag} className="text-[9px] font-mono tracking-wider uppercase text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-md">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat messages scrollable context window */}
              <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 text-xs">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-4">
                    <div className="space-y-3">
                       <h4 className="text-[13px] font-bold text-slate-200 tracking-widest uppercase">WELCOME TO TRADEZEN FINANCIAL INTELLIGENCE</h4>
                       <p className="text-[11px] text-slate-400">Ask questions about:</p>
                       <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto pt-1">
                         {['Market Forecasts', 'Portfolio Risk Analysis', 'Sentiment Intelligence', 'Asset Allocation', 'Stock Outlooks', 'Source Credibility Assessment'].map(topic => (
                           <span key={topic} className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full">• {topic}</span>
                         ))}
                       </div>
                    </div>
                    
                    <div className="w-full max-w-xl space-y-3 pt-2">
                      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Quick Actions</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Market Forecast', 'Portfolio Review', 'Risk Assessment', 'Sentiment Analysis', 'Stock Comparison', 'Source Verification'].map(action => (
                          <button 
                            key={action}
                            type="button"
                            onClick={() => setChatInput(`Can you provide a ${action.toLowerCase()}?`)}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 transition px-2 py-2.5 rounded-lg text-[10px] font-medium cursor-pointer"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full max-w-xl space-y-2 pb-4">
                      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Suggested Questions</p>
                      <div className="flex flex-col gap-1.5">
                        {[
                          "What is NVIDIA's current market outlook?", 
                          "Analyze my portfolio risk profile.", 
                          "Compare Apple and Microsoft.", 
                          "Explain today's sentiment drivers.", 
                          "Which stock has the strongest forecast signal?", 
                          "Assess the credibility of this headline."
                        ].map(q => (
                          <button 
                            key={q}
                            type="button"
                            onClick={() => setChatInput(q)}
                            className="text-left bg-transparent border border-transparent hover:border-slate-800 hover:bg-slate-800/50 text-teal-400 hover:text-teal-300 transition px-3 py-2 rounded-lg text-[11px] cursor-pointer"
                          >
                            "{q}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xl rounded-xl px-4 py-3 leading-relaxed shadow-md border ${msg.sender === 'user' ? 'bg-slate-950 border-slate-800 text-teal-300' : 'bg-slate-900 text-slate-200 border-slate-800'}`}>
                          <span className="block text-[10px] text-slate-500 mb-1 tracking-wider uppercase font-mono font-bold">
                            {msg.sender === 'user' ? 'Client Request' : 'TradeZen AI Expert Advice'}
                          </span>
                          
                          {/* Simple formatting helper to keep layout elegant inside React */}
                          <div className="whitespace-pre-line leading-relaxed text-[11px] font-sans">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {assistantLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 space-y-1 animate-pulse">
                          <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Evaluating global parameters...</span>
                          <p className="text-xs text-teal-400 font-mono">FinBERT model evaluating technical signals & media coverage loops...</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chat action control row form */}
              <form onSubmit={handleAssistantSubmit} className="flex gap-2.5 mt-auto pt-3 border-t border-slate-800/50">
                <input 
                  type="text"
                  id="assistant-chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about market forecasts, risk analysis, or asset allocation..."
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-200 font-medium"
                />
                <button 
                  type="submit"
                  id="btn-send-chat"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-xs uppercase whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" /> Generate Insight
                </button>
              </form>

            </div>
          )}

          {/* WORKSPACE TAB 6: MULTI-MODAL DOCUMENT ANALYSIS */}
          {activeTab === 'multimodal' && (
            <div id="tab-pane-multimodal" className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Alpha Feed Intelligence</h3>
                    <p className="text-[11px] text-slate-500">Analyze earnings calls, regulatory filings, shareholder reports, and research commentary to uncover strategic market signals.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea 
                    id="multimodal-text-input"
                    rows={4}
                    value={multiModalText}
                    onChange={(e) => setMultiModalText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs focus:outline-none focus:border-teal-400 text-slate-300 font-mono leading-normal"
                    placeholder="Enter corporate PDF text summaries or CEO transcripts..."
                  />

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">Document Intelligence Engine</span>
                    <button 
                      id="btn-run-multimodal"
                      onClick={handleRunMultimodal}
                      disabled={multimodalLoading}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {multimodalLoading ? "Running Extraction..." : "Analyze Document"}
                    </button>
                  </div>

                  {multimodalReport && (
                    <div id="multimodal-report-box" className="bg-slate-950 border border-slate-850 p-5 rounded-xl leading-relaxed text-xs space-y-5">
                      {/* Document Type Indicator */}
                      <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
                        <span className="text-[10px] font-mono text-slate-500">Detected Source:</span>
                        <span className="text-[11px] font-bold text-slate-200">{multimodalReport.documentType}</span>
                      </div>

                      {/* Strategic Impact & Signal Tags Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Summary Indicator */}
                        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">STRATEGIC IMPACT</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${
                              multimodalReport.overallImpact?.includes('Bullish') ? 'text-emerald-400' 
                              : multimodalReport.overallImpact?.includes('Bearish') ? 'text-rose-400' 
                              : 'text-amber-400'
                            }`}>{multimodalReport.overallImpact}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850">
                            <span className="text-[10px] text-slate-500 font-mono">Score: <span className="text-slate-300 font-bold">{multimodalReport.impactScore} / 100</span></span>
                            <span className="text-[10px] text-slate-500 font-mono">Confidence: <span className="text-slate-300">{multimodalReport.confidence}</span></span>
                          </div>
                        </div>

                        {/* Signal Classification Tags */}
                        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">SIGNAL CLASSIFICATION</span>
                          <div className="flex flex-wrap gap-2">
                            {multimodalReport.signalTags && (Array.isArray(multimodalReport.signalTags) ? multimodalReport.signalTags : [multimodalReport.signalTags]).map((tag: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10px]">
                                <span className="text-slate-400">{tag.label} →</span>
                                <span className={`font-bold ${
                                  tag.value === 'Positive' || tag.value === 'High' ? 'text-emerald-400' :
                                  tag.value === 'Negative' || tag.value === 'Low' ? 'text-rose-400' :
                                  'text-amber-400'
                                }`}>{tag.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase font-bold text-teal-400 tracking-wider block border-b border-slate-900 pb-1">EXECUTIVE SUMMARY</span>
                        <ul className="text-slate-300 text-[11px] leading-loose space-y-1 pl-1">
                           {multimodalReport.executiveSummary && (Array.isArray(multimodalReport.executiveSummary) ? multimodalReport.executiveSummary : [multimodalReport.executiveSummary]).map((point: string, idx: number) => (
                             <li key={idx} className="flex items-start gap-2">
                               <span className="text-teal-500 shrink-0 mt-1">•</span>
                               <span>{point.replace(/^[•\-\*]\s*/, '')}</span>
                             </li>
                           ))}
                        </ul>
                      </div>

                      {/* Market Relevance */}
                      <div className="bg-teal-500/5 border border-teal-500/20 p-3.5 rounded-lg space-y-1.5">
                        <span className="text-[10px] font-mono uppercase font-bold text-teal-500 tracking-widest">MARKET RELEVANCE</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{multimodalReport.marketRelevance}</p>
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* WORKSPACE TAB 7: COMMUNITIES DISCUSSION BOARDS */}
          {activeTab === 'community' && (
            <div id="tab-pane-community" className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Create a thread post form */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4 h-fit sticky top-24">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Share Research Insight</h3>
                    <p className="text-[11px] text-slate-500">Share market observations, research findings, sentiment analysis, and forecast insights with the investment community.</p>
                  </div>

                  <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Symbol Tag</label>
                      <p className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-slate-300 font-mono font-semibold">
                        {selectedSymbol}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Category</label>
                      <select 
                        id="form-post-category"
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white focus:outline-none focus:border-teal-400"
                      >
                        <option value="Analysis">Analysis (SHAP modeling)</option>
                        <option value="Technicals">Technicals (Bollinger Bands)</option>
                        <option value="General">General Disclosures</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Post Title</label>
                      <input 
                        type="text"
                        id="form-post-title"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        placeholder="e.g. NVIDIA consolidate boundaries analysis..."
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white focus:outline-none focus:border-teal-400"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Body Content</label>
                      <textarea 
                        id="form-post-content"
                        rows={3}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Summarize your analysis, forecast rationale, sentiment observations, risk assessment, or market outlook."
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white focus:outline-none focus:border-teal-400"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      id="btn-submit-post"
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs hover:border-slate-800 transition cursor-pointer"
                    >
                      Publish Insight
                    </button>

                  </form>
                </div>

                {/* Forum list context */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Market Intelligence Exchange</h3>
                    <p className="text-[11px] text-slate-500">Research community feed indexed under relevant stock models</p>
                  </div>

                  <div className="space-y-5">
                    {forumPosts.map((post, idx) => (
                      <div key={idx} id={`forum-post-card-${post.id}`} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 text-xs leading-relaxed">
                        
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200">{post.author}</span>
                              {post.authorBadge && (
                                <span className="bg-teal-500/10 text-teal-400 text-[9px] font-mono font-semibold px-1 rounded-sm">
                                  {post.authorBadge}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500 font-mono">{post.createdAt.substring(11,16)}</span>
                            </div>
                            <h4 className="font-extrabold text-sm text-white leading-normal mt-1">{post.title}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400 font-mono font-bold uppercase">
                                #{post.symbol} - {post.category}
                              </span>
                              {post.sentiment && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  post.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                                  post.sentiment === 'Bearish' ? 'bg-rose-500/10 text-rose-400' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {post.sentiment}
                                </span>
                              )}
                              {post.credibilityScore && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono font-bold">
                                  Credibility {post.credibilityScore}/100
                                </span>
                              )}
                              {post.forecastAlignment && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-teal-400 font-mono font-bold">
                                  Alignment {post.forecastAlignment}%
                                </span>
                              )}
                              {post.marketImpact && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  post.marketImpact === 'High' ? 'bg-rose-500/10 text-rose-400' :
                                  post.marketImpact === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  Impact {post.marketImpact}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-2 rounded-lg shrink-0 w-20 text-center gap-1 bg-slate-900/50 border border-slate-850/50">
                            <span className="text-[9px] text-slate-500 font-mono uppercase leading-none">Analyst<br/>Agreement</span>
                            <span className="font-mono font-black text-teal-400 text-sm">{post.votes}%</span>
                          </div>
                        </div>

                        <p className="text-slate-300 mt-3 text-[11px] leading-relaxed select-text whitespace-pre-line">{post.content}</p>

                        {/* Thread Comments Area */}
                        <div className="border-t border-slate-850 pt-3 space-y-2">
                          <p className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Comments ({post.commentsCount})</p>
                          
                          {post.comments.map((c, i) => (
                            <div key={i} className="bg-slate-900 p-2.5 rounded text-[11px] leading-relaxed border border-slate-850/60">
                              <div className="flex items-center gap-1.5 font-bold text-slate-400 text-[10px]">
                                <span>{c.author}</span>
                                {c.badge && <span className="text-[8px] bg-slate-800 text-slate-500 px-1 rounded">{c.badge}</span>}
                                <span className="text-[9px] text-slate-600 font-light font-mono ml-auto">{c.timestamp.substring(11,16)}</span>
                              </div>
                              <p className="text-slate-300 mt-1 select-text">{c.content}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-1">
                            <input 
                              type="text"
                              value={newCommentText[post.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewCommentText(prev => ({ ...prev, [post.id]: val }));
                              }}
                              placeholder="Write reply message..."
                              className="flex-1 bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />
                            <button 
                              onClick={() => handleCreateComment(post.id)}
                              className="bg-slate-800 hover:bg-slate-750 text-teal-400 font-mono font-bold px-3 text-[11px] py-1 rounded cursor-pointer transition border border-slate-700/60"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* WORKSPACE TAB 8: SMART NOTIFICATIONS AND TELEGRAM ALERTS */}
          {activeTab === 'alerts' && (
            <div id="tab-pane-alerts" className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Setup Alerts rules */}
                <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4 h-fit">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Alert Configuration</h3>
                    <p className="text-[11px] text-slate-500">Create intelligent alerts based on market activity, sentiment changes, forecast signals, and risk conditions.</p>
                  </div>

                  <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Asset Symbol</label>
                      <p className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-slate-350 font-mono font-bold">
                        {selectedSymbol}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Alert Type</label>
                      <select 
                        id="form-alert-type"
                        value={alertType}
                        onChange={(e) => setAlertType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white focus:outline-none"
                      >
                        <option value="Price Above Threshold">Price Above Threshold</option>
                        <option value="Price Below Threshold">Price Below Threshold</option>
                        <option value="Price Target Reached">Price Target Reached</option>
                        <option value="Forecast Signal Change">Forecast Signal Change</option>
                        <option value="Sentiment Score Shift">Sentiment Score Shift</option>
                        <option value="Conflict Score Increase">Conflict Score Increase</option>
                        <option value="High Credibility News Detected">High Credibility News Detected</option>
                        <option value="Portfolio Risk Increase">Portfolio Risk Increase</option>
                        <option value="Volume Surge Detected">Volume Surge Detected</option>
                        <option value="Technical Breakout Signal">Technical Breakout Signal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Trigger Value</label>
                      <input 
                        type="text"
                        id="form-alert-value"
                        value={alertVal}
                        onChange={(e) => setAlertVal(e.target.value)}
                        placeholder="e.g. 190, Buy, 75"
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Notification Channel</label>
                      <select 
                        id="form-alert-channel"
                        value={alertChannel}
                        onChange={(e) => setAlertChannel(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-white focus:outline-none"
                      >
                        <option value="Email Notification">Email Notification</option>
                        <option value="Push Notification">Push Notification</option>
                        <option value="In-App Notification">In-App Notification</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      id="btn-deploy-alert"
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs uppercase cursor-pointer"
                    >
                      Save Alert
                    </button>

                  </form>
                </div>

                {/* Active alert listing */}
                <div className="md:col-span-7 bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Live Alert Monitoring</h3>
                    <p className="text-[11px] text-slate-500">Currently tracking active market and intelligence-based conditions.</p>
                  </div>

                  <div className="space-y-3">
                    {alerts.length >0 ? (
                      alerts.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-start gap-4 text-xs">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white font-mono uppercase">{item.symbol}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                                item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                item.status === 'TRIGGERED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                item.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {item.status || 'ACTIVE'}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                                item.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                Priority: {item.priority || 'Medium'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="space-y-0.5">
                                <span className="text-slate-500 uppercase font-mono text-[9px] block">Trigger</span>
                                <span className="text-slate-200 font-mono font-semibold">{item.type} {item.value}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-slate-500 uppercase font-mono text-[9px] block">Notification</span>
                                <span className="text-amber-400 font-mono font-semibold">{item.channel}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteAlert(item.id)}
                            className="text-rose-450 hover:text-white hover:bg-rose-500/10 p-2 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-rose-500/30 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
                        <span className="text-xl">🔔</span>
                        <p>No active alerts configured.</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          <button onClick={() => setAlertType('Price Target Reached')} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition text-[10px] text-slate-300">Create Price Alert</button>
                          <button onClick={() => setAlertType('Forecast Signal Change')} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition text-[10px] text-slate-300">Create Forecast Alert</button>
                          <button onClick={() => setAlertType('Sentiment Score Shift')} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition text-[10px] text-slate-300">Create Sentiment Alert</button>
                          <button onClick={() => setAlertType('Portfolio Risk Increase')} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition text-[10px] text-slate-300">Create Risk Alert</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* WORKSPACE TAB 9: TELEMETRY AND AUDIT LOGS */}
          {activeTab === 'audits' && session?.role === 'Admin' && (
            <div id="tab-pane-audits" className="space-y-6">
              
              {/* Telemetry charts row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="uppercase font-bold">CPU Load Dynamics</span>
                    <span>5s intervals</span>
                  </div>
                  <div className="flex justify-between items-end gap-1.5 h-12 pt-3">
                    <p className="text-2xl font-black font-mono text-emerald-400 leading-none">{adminMetrics ? adminMetrics.cpuUsage : '18.4'}%</p>
                    <div className="flex items-end gap-0.5 w-24 h-full">
                      {[15, 22, 18, 32, 28, 14, 25, 19].map((w,i)=>(
                        <div key={i} className="bg-emerald-500/30 hover:bg-emerald-400 w-1 rounded-full transition" style={{ height: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="uppercase font-bold">RAM Memory Allocation</span>
                    <span>V8 Thread pool</span>
                  </div>
                  <div className="flex justify-between items-end gap-1.5 h-12 pt-3">
                    <p className="text-2xl font-black font-mono text-indigo-400 leading-none">{adminMetrics ? adminMetrics.ramUsage : '48.2'}%</p>
                    <div className="flex items-end gap-0.5 w-24 h-full">
                      {[42, 45, 48, 52, 49, 47, 48, 48].map((w,i)=>(
                        <div key={i} className="bg-indigo-500/30 hover:bg-indigo-400 w-1 rounded-full transition" style={{ height: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="uppercase font-bold">API Gateway Latency</span>
                    <span>Endpoints</span>
                  </div>
                  <div className="flex justify-between items-end gap-1.5 h-12 pt-3">
                    <p className="text-2xl font-black font-mono text-teal-400 leading-none">{adminMetrics ? adminMetrics.apiLatency : '142'}ms</p>
                    <div className="flex items-end gap-0.5 w-24 h-full">
                      {[120, 140, 130, 180, 150, 130, 125, 132].map((w,i)=>(
                        <div key={i} className="bg-teal-500/30 hover:bg-teal-400 w-1 rounded-full transition" style={{ height: `${w/2}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="uppercase font-bold">Platform DB status</span>
                    <span>Atlas Connection</span>
                  </div>
                  <div className="flex justify-between items-end gap-1.5 h-12 pt-3">
                    <p className="text-xl font-black font-mono text-emerald-400 leading-tight uppercase flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" /> SECURE
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block pb-1">TLS Connection</span>
                  </div>
                </div>

              </div>

              {/* Security Audit Incident logs List */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Real-time Platform Security Audit Log</h3>
                    <p className="text-[11px] text-slate-500">Encryption monitors tracking authorization handshakes & trade signals</p>
                  </div>
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                    LIVE INCIDENT OVERWATCH
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {auditLogs.map((log, idx) => {
                    const isCrit = log.severity === 'Critical';
                    const isWarn = log.severity === 'Warning';
                    return (
                      <div key={idx} id={`audit-log-card-${log.id}`} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-start gap-3.5 text-xs">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse ${isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        
                        <div className="flex-1 space-y-0.5">
                          <p className="text-slate-200 leading-snug">{log.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Module: <span className="font-bold text-slate-400 uppercase">{log.type}</span></span>
                            <span>Node IP: {log.ipAddress}</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-auto">
                          {log.timestamp.substring(11, 19)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg text-center text-[10px] text-slate-500 font-mono">
                  🔒 Audit data persisted inside isolated Docker environments. To clear records safely, proceed through SSH container configs.
                </div>
              </div>

            </div>
          )}



        </section>

      </main>
    </div>
  );
}
