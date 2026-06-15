const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const s1 = code.indexOf('{/* Explainable AI & SHAP details */}');
const e1 = code.indexOf('{/* WORKSPACE TAB 3: NLP SENTIMENT ANALYZER */}');

if(s1 !== -1 && e1 !== -1) {
  const replaceStr = `
              {/* AI Decision Breakdown */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider font-mono">AI Decision Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-1">Shows which factors influenced the forecast and how strongly they affected the prediction.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { title: "FinBERT Institutional News", valueLabel: "Sentiment Score", value: "+0.82", impact: activeStockDetail.prediction.shapReasoning.finbertNews },
                    { title: "FinBERT Social Sentiment", valueLabel: "Sentiment Score", value: "+0.61", impact: activeStockDetail.prediction.shapReasoning.finbertSocial },
                    { title: "Conflict Score", valueLabel: "Current Value", value: "0.18", impact: activeStockDetail.prediction.shapReasoning.conflictScore },
                    { title: "Sentiment Decay Factor", valueLabel: "Current Value", value: "0.91", impact: activeStockDetail.prediction.shapReasoning.decayedSentiment },
                    { title: "Technical Signals", valueLabel: "Strength", value: "Moderate", impact: activeStockDetail.prediction.shapReasoning.technicalIndicators }
                  ].map((driver, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <p className="text-xs font-bold text-slate-300 leading-tight">{driver.title}</p>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{driver.valueLabel}</p>
                        <p className="text-sm font-mono text-white font-bold">{driver.value}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Impact</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-teal-400 font-mono">{driver.impact}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/50 space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">AI Market Summary</h4>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "Positive institutional news sentiment and strong social sentiment are supporting bullish momentum. Low disagreement between sources and highly recent news signals increase forecast confidence."
                  </p>
                </div>
              </div>

            </div>
          )}

          `;
  code = code.substring(0, s1) + replaceStr + code.substring(e1);

  // Also replace LSTM title
  code = code.replace(
      '<h2 className="text-lg font-extrabold text-white">LSTM Deep Prediction Matrix</h2>',
      '<h2 className="text-lg font-extrabold text-white">AI Market Forecast</h2>'
  );
  code = code.replace(
      '<p className="text-xs text-slate-400">Recurrent forecasting network processing technical momentum & financial news inputs</p>',
      '<p className="text-xs text-slate-400">Model-driven price targeting based on sentiment and technical context.</p>'
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log('Replaced prediction cards');
} else {
  console.log('Could not find indices', s1, e1);
}
