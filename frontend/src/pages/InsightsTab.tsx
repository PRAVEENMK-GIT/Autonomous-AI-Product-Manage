import React, { useState } from "react";
import {
  Sparkles,
  Search,
  AlertTriangle,
  Lightbulb,
  Building2,
  Edit3,
  Tag,
} from "lucide-react";
import { InsightEditModal } from "../components/InsightEditModal";
import { SentimentBadge } from "../components/SentimentBadge";
import type { Insight, Sentiment, SourceType } from "../types";

interface InsightsTabProps {
  insights: Insight[];
  totalInsights: number;
  isLoading: boolean;
  selectedTheme: string;
  setSelectedTheme: (t: string) => void;
  selectedSentiment: Sentiment | "all";
  setSelectedSentiment: (s: Sentiment | "all") => void;
  selectedSource: SourceType | "all";
  setSelectedSource: (s: SourceType | "all") => void;
  onUpdateInsight: (id: string, updated: Partial<Insight>) => Promise<void>;
  onClearFilters: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  insights,
  totalInsights,
  selectedTheme,
  setSelectedTheme,
  selectedSentiment,
  setSelectedSentiment,
  selectedSource,
  setSelectedSource,
  onUpdateInsight,
  onClearFilters,
}) => {
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);

  const hasActiveFilters =
    selectedTheme !== "" || selectedSentiment !== "all" || selectedSource !== "all";

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Structured Insights Explorer</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
              {totalInsights} Processed
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse LLM-extracted sentiments, normalized themes, friction points, and competitor signals.
            Every insight can be inspected, corrected, and verified by a human PM.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            placeholder="Filter by theme (e.g. search speed, pricing, onboarding)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
            <option value="mixed">Mixed</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="feedback">Feedback</option>
            <option value="survey">Survey</option>
            <option value="competitor">Competitor</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition border border-rose-900/50 cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No matching insights found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try clearing filters to see all analyzed insights."
              : "No documents have been analyzed yet. Go to Documents and click Analyze."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SentimentBadge sentiment={ins.sentiment} />
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        ins.reviewStatus === "edited"
                          ? "bg-purple-950/60 text-purple-300 border-purple-800"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {ins.reviewStatus === "edited" ? "Human Edited" : "AI Draft"}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {ins.sourceType}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3">
                  {ins.summary}
                </p>

                {ins.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ins.themes.map((theme, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-900/60"
                      >
                        <Tag className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{theme}</span>
                      </span>
                    ))}
                  </div>
                )}

                {ins.painPoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <h5 className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Pain Points</span>
                    </h5>
                    <ul className="space-y-1">
                      {ins.painPoints.map((p, i) => (
                        <li key={i} className="text-xs text-slate-300 pl-2 border-l border-rose-800/60">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ins.featureRequests.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <h5 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>Feature Requests</span>
                    </h5>
                    <ul className="space-y-1">
                      {ins.featureRequests.map((r, i) => (
                        <li key={i} className="text-xs text-slate-300 pl-2 border-l border-amber-800/60">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ins.competitorMentions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <h5 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Building2 className="w-3 h-3 text-purple-400" />
                      <span>Competitors: {ins.competitorMentions.join(", ")}</span>
                    </h5>
                    {ins.competitor?.pricing && ins.competitor.pricing.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        Pricing: {ins.competitor.pricing.join("; ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-[10px]">Doc: {ins.documentId.slice(-6)}</span>
                <button
                  onClick={() => setEditingInsight(ins)}
                  className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Review / Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingInsight && (
        <InsightEditModal
          insight={editingInsight}
          isOpen={!!editingInsight}
          onClose={() => setEditingInsight(null)}
          onSave={onUpdateInsight}
        />
      )}
    </div>
  );
};
