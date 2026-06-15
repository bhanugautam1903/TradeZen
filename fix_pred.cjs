const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const s1 = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">');
const e1 = code.indexOf('              </div>\n\n              {/* Explainable AI & SHAP details */}');

if(s1 !== -1 && e1 !== -1) {
  const replaceStr = `
                <div className="mt-6 bg-slate-950/40 border border-slate-800/80 rounded-xl p-6">
                  <h3 className="text-[11px] text-slate-500 uppercase font-mono font-bold tracking-wider mb-6">Next Day Forecast</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Direction</p>
                      <p className={\`text-xl font-bold uppercase \${activeStockDetail.prediction.expectedGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
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
                        \${(activeStockDetail.quote.price * (1 + (activeStockDetail.prediction.expectedGrowth / 100))).toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Expected Gain</p>
                      <p className={\`text-xl font-bold font-mono \${activeStockDetail.prediction.expectedGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                        {activeStockDetail.prediction.expectedGrowth >= 0 ? '+' : ''}{activeStockDetail.prediction.expectedGrowth}%
                      </p>
                    </div>
                  </div>
                </div>
`;
  code = code.substring(0, s1) + replaceStr + code.substring(e1);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Replaced prediction cards');
} else {
  console.log('Could not find indices');
}
