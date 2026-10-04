import React, { useState } from "react";
import {
  BarChart3,
  Quote,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import type { ThemeStat } from "../types";

interface ThemesTabProps {
  themeStats: ThemeStat[];
  totalDocs: number;
}

export const ThemesTab: React.FC<ThemesTabProps> = ({
  themeStats,
  totalDocs,
}) => {
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(
    new Set(themeStats.slice(0, 2).map((t) => t.theme))
  );

  const toggleExpand = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  };

  const maxCount = themeStats.length > 0 ? themeStats[0].count : 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Ranked Themes & Verbatim Evidence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Themes are strictly computed in Python code, never estimated by the LLM.
            Every quote displayed below is cryptographically guaranteed to be a verbatim substring of a source document.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Analyzed</span>
          <span className="text-xl font-bold text-indigo-400">{totalDocs} Documents</span>
        </div>
      </div>

      {themeStats.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No theme statistics computed yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Analyze documents to calculate theme frequencies and aggregate verbatim evidence quotes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {themeStats.map((stat, idx) => {
            const isExpanded = expandedThemes.has(stat.theme);
            const percentage = totalDocs > 0 ? ((stat.count / totalDocs) * 100).toFixed(1) : "0";
            const relativeWidth = Math.max(12, Math.round((stat.count / maxCount) * 100));

            return (
              <div
                key={stat.theme}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg transition hover:border-slate-700/80"
              >
                <div
                  onClick={() => toggleExpand(stat.theme)}
                  className="flex items-center justify-between cursor-pointer select-none gap-4"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm capitalize">
                        {stat.theme}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {stat.count} mentions ({percentage}% of input)
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md hidden sm:block">
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${relativeWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400 font-medium">
                      {stat.examples.length} Evidence Quotes
                    </span>
                    <button className="p-1 rounded text-slate-400 hover:text-white">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && stat.examples.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5 animate-in fade-in">
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Quote className="w-3 h-3 text-indigo-400" />
                      <span>Verbatim User Quotes</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stat.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between"
                        >
                          <blockquote className="text-xs text-slate-200 italic leading-relaxed">
                            "{ex.quote}"
                          </blockquote>
                          <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified Substring</span>
                            </span>
                            <span className="font-mono">Doc: {ex.documentId.slice(-6)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
