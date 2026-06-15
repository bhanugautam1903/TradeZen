const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const helper = `
const formatFinancialValue = (valueStr: string | number, alwaysShowSign = false): string => {
  const num = Number(valueStr);
  if (isNaN(num)) return \`\${alwaysShowSign ? '+' : ''}$0.00\`;
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
  return \`\${sign}$\${formatted}\`;
};
`;

if (!code.includes('formatFinancialValue')) {
  code = code.replace(
    "export default function App() {",
    helper + "\nexport default function App() {"
  );
}

// Function to assist replacing blocks.
function replaceBlock(search, replace) {
  if (code.includes(search)) {
    code = code.replace(search, replace);
  } else {
    console.error("NOT FOUND:\n" + search);
  }
}

// 1. Total Portfolio Value
replaceBlock(
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Total Portfolio Value</p>\n                  <p className="text-xl font-black font-mono text-white">${portfolioStats.currentMarketValue}</p>',
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Portfolio Value</p>\n                  <p className="text-xl md:text-2xl font-black font-mono text-white truncate tracking-tight">{formatFinancialValue(portfolioStats.currentMarketValue)}</p>'
);

// 2. Total Invested Amount
replaceBlock(
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Total Invested Amount</p>\n                  <p className="text-xl font-black font-mono text-slate-300">${portfolioStats.totalInvested}</p>',
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Invested Amount</p>\n                  <p className="text-xl md:text-2xl font-black font-mono text-slate-300 truncate tracking-tight">{formatFinancialValue(portfolioStats.totalInvested)}</p>'
);

// 3. Net Returns
replaceBlock(
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Net Returns</p>\n                  <p className={`text-xl font-black font-mono ${Number(portfolioStats.netReturns) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.netReturns) >= 0 ? \'+\' : \'\'}${portfolioStats.netReturns}\n                  </p>',
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Net Returns</p>\n                  <p className={`text-xl md:text-2xl font-black font-mono truncate tracking-tight ${Number(portfolioStats.netReturns) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {formatFinancialValue(portfolioStats.netReturns, true)}\n                  </p>'
);

// 4. ROI Percentage
replaceBlock(
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">ROI Percentage</p>\n                  <p className={`text-xl font-black font-mono ${Number(portfolioStats.roi) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.roi) >= 0 ? \'+\' : \'\'}{portfolioStats.roi}%\n                  </p>',
  '<p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">ROI Percentage</p>\n                  <p className={`text-xl md:text-2xl font-black font-mono truncate tracking-tight ${Number(portfolioStats.roi) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.roi) >= 0 ? \'+\' : \'\'}{Number(portfolioStats.roi).toFixed(1)}%\n                  </p>'
);

// 5. Total Profit
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Total Profit</p>\n                  <p className="text-lg font-bold font-mono text-emerald-400">${portfolioStats.totalProfit}</p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Profit</p>\n                  <p className="text-lg md:text-xl font-bold font-mono text-emerald-400 truncate tracking-tight">{formatFinancialValue(portfolioStats.totalProfit, true)}</p>'
);

// 6. Total Loss
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Total Loss</p>\n                  <p className="text-lg font-bold font-mono text-rose-450">-${portfolioStats.totalLoss}</p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Total Loss</p>\n                  <p className="text-lg md:text-xl font-bold font-mono text-rose-450 truncate tracking-tight">{formatFinancialValue("-" + portfolioStats.totalLoss)}</p>'
);

// 7. Daily PnL
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Daily PnL</p>\n                  <p className={`text-lg font-bold font-mono ${Number(portfolioStats.dailyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.dailyPnL) >= 0 ? \'+\' : \'\'}${portfolioStats.dailyPnL}\n                  </p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Daily PnL</p>\n                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.dailyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {formatFinancialValue(portfolioStats.dailyPnL, true)}\n                  </p>'
);

// 8. Weekly PnL
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Weekly PnL</p>\n                  <p className={`text-lg font-bold font-mono ${Number(portfolioStats.weeklyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.weeklyPnL) >= 0 ? \'+\' : \'\'}${portfolioStats.weeklyPnL}\n                  </p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Weekly PnL</p>\n                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.weeklyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {formatFinancialValue(portfolioStats.weeklyPnL, true)}\n                  </p>'
);

// 9. Monthly PnL
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Monthly PnL</p>\n                  <p className={`text-lg font-bold font-mono ${Number(portfolioStats.monthlyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.monthlyPnL) >= 0 ? \'+\' : \'\'}${portfolioStats.monthlyPnL}\n                  </p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Monthly PnL</p>\n                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.monthlyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {formatFinancialValue(portfolioStats.monthlyPnL, true)}\n                  </p>'
);

// 10. Yearly PnL
replaceBlock(
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Yearly PnL</p>\n                  <p className={`text-lg font-bold font-mono ${Number(portfolioStats.yearlyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {Number(portfolioStats.yearlyPnL) >= 0 ? \'+\' : \'\'}${portfolioStats.yearlyPnL}\n                  </p>',
  '<div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-center space-y-1">\n                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate">Yearly PnL</p>\n                  <p className={`text-lg md:text-xl font-bold font-mono truncate tracking-tight ${Number(portfolioStats.yearlyPnL) >= 0 ? \'text-emerald-400\' : \'text-rose-450\'}`}>\n                    {formatFinancialValue(portfolioStats.yearlyPnL, true)}\n                  </p>'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Script execution done.");
