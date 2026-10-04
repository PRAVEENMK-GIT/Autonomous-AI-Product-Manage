import React, { useState } from "react";
import {
  Sparkles,
  Search,
  AlertTriangle,
  Lightbulb,
  Building2,
  Edit3,
  XCircle,
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
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header Banner */}
      <div className="neo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#55E6A5] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
              <Sparkles className="w-5 h-5 stroke-[2.5] text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                  Structured Insights Explorer
                </h2>
                <span className="neo-badge bg-[#55E6A5] text-black text-[11px]">
                  {totalInsights} Processed
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-700 mt-1">
                Browse AI-extracted sentiments, normalized themes, friction points, and competitor signals.
                Every insight is human-reviewable with immutable version tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="neo-card-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          <input
            type="text"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            placeholder="Filter by theme (e.g. search speed, pricing, export)..."
            className="neo-input pl-10 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value as any)}
            className="neo-select"
          >
            <option value="all">ALL SENTIMENTS</option>
            <option value="positive">POSITIVE</option>
            <option value="negative">NEGATIVE</option>
            <option value="neutral">NEUTRAL</option>
            <option value="mixed">MIXED</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as any)}
            className="neo-select"
          >
            <option value="all">ALL SOURCES</option>
            <option value="feedback">FEEDBACK</option>
            <option value="survey">SURVEY</option>
            <option value="competitor">COMPETITOR</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="neo-btn bg-[#FF6B6B] text-black px-3.5 py-2 text-xs uppercase tracking-wider hover:bg-[#FF5252]"
            >
              <XCircle className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Insights Cards Grid */}
      {insights.length === 0 ? (
        <div className="neo-card p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000000]">
            <Sparkles className="w-8 h-8 stroke-[2.5] text-black" />
          </div>
          <h3 className="text-lg font-black uppercase text-black">No matching insights found</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your theme search or sentiment filters."
              : "Analyze pending documents to populate structured insights."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="neo-card p-6 flex flex-col justify-between hover:shadow-[7px_7px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all bg-white"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SentimentBadge sentiment={insight.sentiment} />
                    <span className="neo-badge bg-[#C4B5FD] text-black text-[10px]">
                      {insight.sourceType}
                    </span>
                    {insight.reviewStatus === "edited" && (
                      <span className="neo-badge bg-[#55E6A5] text-black text-[10px]">
                        Human Edited
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingInsight(insight)}
                    className="neo-btn bg-[#FFE600] text-black px-3 py-1.5 text-[11px] uppercase tracking-wider hover:bg-[#FFD600]"
                  >
                    <Edit3 className="w-3 h-3 mr-1 stroke-[2.5]" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Themes list */}
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.themes.map((theme) => (
                      <span
                        key={theme}
                        onClick={() => setSelectedTheme(theme)}
                        className="cursor-pointer neo-badge bg-[#FAF7F2] text-black text-[10px] hover:bg-[#FFE600] transition-colors"
                      >
                        #{theme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="p-3 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]">
                  <p className="text-xs font-semibold text-black leading-relaxed">
                    {insight.summary}
                  </p>
                </div>

                {/* Pain Points */}
                {insight.painPoints.length > 0 && (
                  <div className="p-3 bg-[#FFF0F0] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#D90429] tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Friction & Pain Points ({insight.painPoints.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {insight.painPoints.map((point, i) => (
                        <li key={i} className="text-xs font-semibold text-neutral-900 flex items-start gap-1.5 leading-snug">
                          <span className="text-black font-black">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Feature Requests */}
                {insight.featureRequests.length > 0 && (
                  <div className="p-3 bg-[#F0FFF4] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#008000] tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Requested Capabilities ({insight.featureRequests.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {insight.featureRequests.map((req, i) => (
                        <li key={i} className="text-xs font-semibold text-neutral-900 flex items-start gap-1.5 leading-snug">
                          <span className="text-black font-black">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competitor Signals */}
                {insight.competitorMentions && insight.competitorMentions.length > 0 && (
                  <div className="p-3 bg-[#F0F9FF] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#0284C7] tracking-wider">
                      <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Competitors Mentioned</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {insight.competitorMentions.map((c) => (
                        <span key={c} className="neo-badge bg-white text-black text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t-2 border-black flex items-center justify-between text-[11px] font-mono text-neutral-600">
                <span>Model: {insight.model.split("/").pop()}</span>
                <span>v{insight.promptVersion}</span>
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
