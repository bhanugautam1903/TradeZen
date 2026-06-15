/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  market: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  sector: string;
}

export interface StockPrediction {
  symbol: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  direction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number; // 0 to 100
  expectedGrowth: number; // e.g. 4.2 for +4.2%
  probabilityScore: number; // 0 to 100
  timeframe: 'Next Day' | 'Next Week' | 'Next Month';
  shapReasoning: {
    finbertNews: number;
    finbertSocial: number;
    conflictScore: number;
    decayedSentiment: number;
    technicalIndicators: number;
  };
}

export interface SentimentAnalysis {
  symbol: string;
  score: number; // 0 to 100
  mood: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  positive: number; // percentage
  negative: number; // percentage
  neutral: number; // percentage
  newsCount: number;
  socialCount: number;
  botScore: number; // bot activity percentage e.g. 22
  authenticSentimentScore: number; // e.g. 78
  botSentimentScore: number; // e.g. 12
}

export interface RiskAnalysis {
  symbol: string;
  riskRating: 'Low' | 'Medium' | 'High' | 'Extreme';
  riskScore: number; // 0 to 100
  volatility: number; // 0 to 100
  marketUncertainty: number; // 0 to 100
  sentimentStability: number; // 0 to 100
  historicalRisk: number; // 0 to 100
}

export interface NewsArticle {
  id: string;
  symbol: string;
  title: string;
  source: string;
  summary: string;
  publishTime: string;
  url: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  credibilityScore: number; // 0 to 100
  clickbaitRisk: 'Low' | 'Medium' | 'High';
  isManipulated: boolean;
  isTrusted: boolean;
}

export interface ForumComment {
  id: string;
  postId: string;
  author: string;
  badge?: string;
  content: string;
  timestamp: string;
  votes: number;
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorBadge?: string;
  votes: number;
  commentsCount: number;
  category: string;
  symbol: string;
  lastActive: string;
  content: string;
  comments: ForumComment[];
  createdAt: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  credibilityScore: number;
  forecastAlignment: number;
  marketImpact: 'High' | 'Medium' | 'Low';
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  market: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
}

export interface AlertConfig {
  id: string;
  symbol: string;
  type: string;
  value: number | string;
  active: boolean;
  channel: string;
  createdAt: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'PAUSED' | 'EXPIRED';
  priority: 'High' | 'Medium' | 'Low';
}

export interface SecurityAuditLog {
  id: string;
  type: 'Auth' | 'Portfolio' | 'Alert' | 'Admin' | 'System';
  severity: 'Info' | 'Warning' | 'Critical';
  description: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export interface UserSessionRecord {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  loginTimestamp: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'User' | 'Admin';
  isTwoFactorSetup: boolean;
  isOtpVerified: boolean;
  token: string;
  profilePicture?: string;
  username?: string;
  mobileNumber?: string;
  country?: string;
  currency?: string;
  subscriptionPlan?: string;
  accountCreationDate?: string;
}

export interface Transaction {
  id: string;
  type: 'Buy' | 'Sell';
  symbol: string;
  quantity: number;
  price: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  profitOrLoss?: number;
}

export interface UserDevice {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginActivity {
  id: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  status: 'Success' | 'Failed';
  device: string;
}

export interface SystemHealth {
  cpuUsage: number;
  ramUsage: number;
  apiLatency: number;
  dbStatus: 'Connected' | 'Disconnected';
  activeAlertsCount: number;
  blockedBotIpsCount: number;
}
