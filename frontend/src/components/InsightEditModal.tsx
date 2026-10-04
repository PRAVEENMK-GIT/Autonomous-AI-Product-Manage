import React, { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import type { Insight, Sentiment } from "../types";

interface InsightEditModalProps {
  insight: Insight;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Insight>) => Promise<void>;
}

export const InsightEditModal: React.FC<InsightEditModalProps> = ({
  insight,
  isOpen,
  onClose,
  onSave,
}) => {
  const [sentiment, setSentiment] = useState<Sentiment>(insight.sentiment);
  const [themesStr, setThemesStr] = useState(insight.themes.join(", "));
  const [painPointsStr, setPainPointsStr] = useState(insight.painPoints.join("\n"));
  const [featureRequestsStr, setFeatureRequestsStr] = useState(insight.featureRequests.join("\n"));
  const [summary, setSummary] = useState(insight.summary);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const parsedThemes = themesStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const parsedPainPoints = painPointsStr
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const parsedFeatureRequests = featureRequestsStr
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      await onSave(insight.id, {
        sentiment,
        themes: parsedThemes,
        painPoints: parsedPainPoints,
        featureRequests: parsedFeatureRequests,
        summary,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update insight.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Edit AI Insight</h3>
            <p className="text-xs text-slate-400">
              Human review & override (sets status to <span className="text-indigo-400 font-semibold">Edited</span>)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Sentiment
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["positive", "negative", "neutral", "mixed"] as Sentiment[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSentiment(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition cursor-pointer ${
                    sentiment === s
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Themes (Comma separated, normalized lowercase)
            </label>
            <input
              type="text"
              value={themesStr}
              onChange={(e) => setThemesStr(e.target.value)}
              placeholder="search speed, pricing, export options"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Summary (1-2 sentences)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Pain Points (One per line)
            </label>
            <textarea
              value={painPointsStr}
              onChange={(e) => setPainPointsStr(e.target.value)}
              rows={3}
              placeholder="Slow query indexing..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Feature Requests (One per line)
            </label>
            <textarea
              value={featureRequestsStr}
              onChange={(e) => setFeatureRequestsStr(e.target.value)}
              rows={3}
              placeholder="Add CSV export option..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Overrides"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
