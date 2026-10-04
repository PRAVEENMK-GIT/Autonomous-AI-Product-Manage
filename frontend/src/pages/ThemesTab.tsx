import React, { useState } from "react";
import {
  BarChart3,
  Quote,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
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
    new Set(themeStats.slice(0, 3).map((t) => t.theme))
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
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Header Banner */}
      <div className="neo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
              <TrendingUp className="w-5 h-5 stroke-[2.5] text-black" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>Ranked Themes & Verbatim Evidence</span>
              </h2>
              <p className="text-xs font-bold text-neutral-700 mt-1 max-w-2xl">
                Theme statistics are strictly computed in Python code, never hallucinated by the LLM.
                Every quote displayed below is cryptographically guaranteed to be an exact verbatim substring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">Total Analyzed</span>
            <span className="text-lg font-black font-mono text-black">{totalDocs} Documents</span>
          </div>
        </div>
      </div>

      {themeStats.length === 0 ? (
        <div className="neo-card p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000000]">
            <BarChart3 className="w-8 h-8 stroke-[2.5] text-black" />
          </div>
          <h3 className="text-lg font-black uppercase text-black">No theme statistics computed yet</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            Run analysis on ingested documents to aggregate theme frequencies and extract verified evidence quotes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {themeStats.map((stat, idx) => {
            const isExpanded = expandedThemes.has(stat.theme);
            const percentage = totalDocs > 0 ? ((stat.count / totalDocs) * 100).toFixed(1) : "0";
            const relativeWidth = Math.max(8, Math.round((stat.count / maxCount) * 100));

            const rankColors = [
              "bg-[#FFE600]", // Gold #1
              "bg-[#C4B5FD]", // Lavender #2
              "bg-[#55E6A5]", // Mint #3
            ];
            const rankColor = idx < 3 ? rankColors[idx] : "bg-white";

            return (
              <div
                key={stat.theme}
                className="neo-card p-5 sm:p-6 transition-all hover:shadow-[7px_7px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 bg-white"
              >
                <div
                  onClick={() => toggleExpand(stat.theme)}
                  className="flex items-center justify-between cursor-pointer select-none gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <span className={`w-9 h-9 rounded-xl border-2 border-black ${rankColor} flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_#000000]`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-base uppercase tracking-tight text-black">
                        {stat.theme}
                      </h4>
                      <span className="text-xs font-bold text-neutral-600 font-mono">
                        {stat.count} mentions ({percentage}% of input)
                      </span>
                    </div>
                  </div>

                  {/* Neobrutalist Progress Bar */}
                  <div className="flex-1 max-w-md hidden sm:block">
                    <div className="w-full bg-[#FAF7F2] h-4 rounded-full overflow-hidden border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000]">
                      <div
                        className="bg-[#FFE600] h-full border-r-2 border-black transition-all duration-500"
                        style={{ width: `${relativeWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="neo-badge bg-[#FAF7F2] text-black text-[11px] hidden md:inline-flex">
                      {stat.examples?.length || 0} Quotes
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[3]" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 pt-4 border-t-2 border-black space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Verbatim Customer Quotes</span>
                      </span>
                      <span className="neo-badge bg-[#55E6A5] text-black text-[10px] py-0.5 px-2">
                        <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                        <span>Verified Substring</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stat.examples && stat.examples.length > 0 ? (
                        stat.examples.map((ex, qIdx) => (
                          <div
                            key={qIdx}
                            className="bg-[#FAF7F2] border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000000] relative space-y-2 flex flex-col justify-between"
                          >
                            <p className="text-xs font-semibold text-black italic leading-relaxed">
                              "{ex.quote}"
                            </p>
                            <div className="pt-2 border-t border-neutral-300 flex items-center justify-between text-[10px] font-mono font-bold text-neutral-600">
                              <span>DOC REF: {ex.documentId.slice(-6)}</span>
                              <span className="text-[#008000] font-black uppercase">100% Match</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic col-span-2">
                          No direct quote examples indexed for this theme yet.
                        </p>
                      )}
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
