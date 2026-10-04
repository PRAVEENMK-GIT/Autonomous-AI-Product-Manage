import React from "react";
import { Smile, Frown, Meh, Shuffle } from "lucide-react";
import type { Sentiment } from "../types";

export const SentimentBadge: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  switch (sentiment) {
    case "positive":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          <Smile className="w-3.5 h-3.5 text-emerald-400" />
          <span>Positive</span>
        </span>
      );
    case "negative":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <Frown className="w-3.5 h-3.5 text-rose-400" />
          <span>Negative</span>
        </span>
      );
    case "neutral":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <Meh className="w-3.5 h-3.5 text-slate-400" />
          <span>Neutral</span>
        </span>
      );
    case "mixed":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span>Mixed</span>
        </span>
      );
    default:
      return null;
  }
};
