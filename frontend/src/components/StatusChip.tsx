import React from "react";
import { Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { DocStatus } from "../types";

export const StatusChip: React.FC<{ status: DocStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Pending</span>
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#70D6FF] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider animate-pulse">
          <Loader2 className="w-3.5 h-3.5 stroke-[2.5] animate-spin" />
          <span>Processing</span>
        </span>
      );
    case "processed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#55E6A5] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Processed</span>
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FF6B6B] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Failed</span>
        </span>
      );
    default:
      return null;
  }
};
