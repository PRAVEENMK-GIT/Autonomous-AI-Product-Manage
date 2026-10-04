import React from "react";
import { Smile, Frown, Meh, Shuffle } from "lucide-react";
import type { Sentiment } from "../types";

export const SentimentBadge: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  switch (sentiment) {
    case "positive":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#55E6A5] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <Smile className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Positive</span>
        </span>
      );
    case "negative":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FF6B6B] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <Frown className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Negative</span>
        </span>
      );
    case "neutral":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#70D6FF] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <Meh className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Neutral</span>
        </span>
      );
    case "mixed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FFD166] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Mixed</span>
        </span>
      );
    default:
      return null;
  }
};
