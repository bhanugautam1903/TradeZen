const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Card 1
code = code.replace(
  '<h3 className="text-sm font-bold text-slate-300">FinBERT Mood Classifier</h3>\\n                    <p className="text-[11px] text-slate-500">Transformer-trained sentiment classifier for finance</p>',
  '<h3 className="text-sm font-bold text-slate-300">Market Sentiment Intelligence</h3>\\n                    <p className="text-[11px] text-slate-500">Financial sentiment assessment powered by domain-specific language intelligence.</p>'
);

code = code.replace(
  '{activeStockDetail.sentiment.mood}',
  "{activeStockDetail.sentiment.score >= 80 ? 'Strongly Bullish' : activeStockDetail.sentiment.score >= 60 ? 'Bullish' : activeStockDetail.sentiment.score >= 40 ? 'Neutral' : activeStockDetail.sentiment.score >= 20 ? 'Bearish' : 'Strongly Bearish'}"
);

code = code.replace('<span className="text-[9px] text-slate-500 uppercase">Pos</span>', '<span className="text-[9px] text-slate-500 uppercase">Positive</span>');
code = code.replace('<span className="text-[9px] text-slate-500 uppercase">Neu</span>', '<span className="text-[9px] text-slate-500 uppercase">Neutral</span>');
code = code.replace('<span className="text-[9px] text-slate-500 uppercase">Neg</span>', '<span className="text-[9px] text-slate-500 uppercase">Negative</span>');

// Card 2
code = code.replace(
  '<h3 className="text-sm font-bold text-slate-300">Media Credibility Scanner</h3>\\n                    <p className="text-[11px] text-slate-500 font-medium">Verify credentials authenticity and filter out clickbait risk profiles</p>',
  '<h3 className="text-sm font-bold text-slate-300">Source Credibility Assessment</h3>\\n                    <p className="text-[11px] text-slate-500 font-medium">Evaluate information reliability, source quality, and credibility indicators.</p>'
);

code = code.replace(
  '<span className="text-[10px] text-slate-500 font-mono uppercase">Model Source: Gemini 3.5 API Verification</span>',
  '<span className="text-[10px] text-slate-500 font-mono uppercase">Verification Engine: Multi-Factor Source Analysis</span>'
);

code = code.replace(
  '{credLoading ? "Evaluating Credentials..." : "Authenticate Headline"}',
  '{credLoading ? "Evaluating Credentials..." : "Analyze Credibility"}'
);

// Card 3
code = code.replace(
  '<h3 className="text-sm font-bold text-slate-200">Social Forum Bot Activity Detection Scanner</h3>\\n                  <p className="text-[11px] text-slate-500">Scan recent X posts or StockTwits block strings to isolate algorithmic spammers</p>',
  '<h3 className="text-sm font-bold text-slate-200">Market Activity Integrity Monitor</h3>\\n                  <p className="text-[11px] text-slate-500">Analyze market discussions for unusual behavioral patterns and coordinated activity signals.</p>'
);

code = code.replace(
  '<span className="text-slate-400 text-[11px]">COORDINATION METRICS VERDICT</span>',
  '<span className="text-slate-400 text-[11px]">BEHAVIORAL RISK ASSESSMENT</span>'
);

code = code.replace(
  '<span className="text-rose-400">{botReport.botPercent}% Bot Network Density</span>',
  '<span className="text-rose-400">{botReport.botPercent >= 80 ? "High Coordination Risk Detected" : "Elevated Automated Activity Signal"}</span>'
);

code = code.replace(
  '<span className="text-[10px] text-slate-500 uppercase font-mono block">Detected Behavior Fingerprints:</span>',
  '<span className="text-[10px] text-slate-500 uppercase font-mono block">Observed Activity Indicators:</span>'
);

// Example headlines
code = code.replace(
  'const [credNewsHeadline, setCredNewsHeadline] = useState("Apple is set to crash immediately due to massive secret security loopholes inside Cupertino headquarters!");',
  'const [credNewsHeadline, setCredNewsHeadline] = useState("Apple announces expansion of its AI infrastructure investment strategy.");'
);
code = code.replace(
  'placeholder="Insert headline or news statement to perform deep fact checking analysis..."',
  'placeholder="e.g., Apple announces expansion of its AI infrastructure investment strategy."'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Done replacement');
