import React from "react";
import { Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { DocStatus } from "../types";

export const StatusChip: React.FC<{ status: DocStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Processing</span>
        </span>
      );
    case "processed":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>Processed</span>
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <AlertCircle className="w-3 h-3" />
          <span>Failed</span>
        </span>
      );
    default:
      return null;
  }
};
