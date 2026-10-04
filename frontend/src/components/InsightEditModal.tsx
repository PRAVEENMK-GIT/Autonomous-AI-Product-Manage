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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FFFDF5] border-[3px] border-black rounded-2xl w-full max-w-xl overflow-hidden shadow-[10px_10px_0px_0px_#000000] text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FFE600] border-b-[3px] border-black">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black">
              Edit AI Insight (Human Review)
            </h3>
            <p className="text-xs font-bold text-neutral-800">
              Manual correction will mark this insight as{" "}
              <span className="bg-black text-[#55E6A5] px-1.5 py-0.5 rounded font-black text-[10px]">
                HUMAN EDITED
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="neo-btn bg-white text-black p-1.5 hover:bg-neutral-100"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#FF6B6B] border-2 border-black rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-[3px_3px_0px_0px_#000000]">
              <AlertCircle className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
              Sentiment Classification
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["positive", "negative", "neutral", "mixed"] as Sentiment[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSentiment(s)}
                  className={`neo-btn py-2 px-3 text-xs font-black capitalize border-2 border-black ${
                    sentiment === s
                      ? s === "positive"
                        ? "bg-[#55E6A5] text-black shadow-[4px_4px_0px_0px_#000000]"
                        : s === "negative"
                        ? "bg-[#FF6B6B] text-black shadow-[4px_4px_0px_0px_#000000]"
                        : s === "neutral"
                        ? "bg-[#70D6FF] text-black shadow-[4px_4px_0px_0px_#000000]"
                        : "bg-[#FFD166] text-black shadow-[4px_4px_0px_0px_#000000]"
                      : "bg-white text-neutral-600 shadow-[2px_2px_0px_0px_#000000] hover:text-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Themes (Comma separated, lowercase)
            </label>
            <input
              type="text"
              value={themesStr}
              onChange={(e) => setThemesStr(e.target.value)}
              placeholder="e.g. search speed, pricing, export options"
              className="neo-input"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Executive Summary (1-2 sentences)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="neo-input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Pain Points (One friction point per line)
            </label>
            <textarea
              value={painPointsStr}
              onChange={(e) => setPainPointsStr(e.target.value)}
              rows={3}
              placeholder="e.g. Slow query indexing..."
              className="neo-input resize-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Feature Requests (One request per line)
            </label>
            <textarea
              value={featureRequestsStr}
              onChange={(e) => setFeatureRequestsStr(e.target.value)}
              rows={3}
              placeholder="e.g. Add CSV export option..."
              className="neo-input resize-none font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn bg-white text-black px-4 py-2.5 text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="neo-btn bg-[#55E6A5] text-black px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#40D695]"
            >
              <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>{isSaving ? "Saving..." : "Save Overrides"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
