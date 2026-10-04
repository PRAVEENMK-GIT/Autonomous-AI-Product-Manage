import React, { useState } from "react";
import {
  Play,
  RotateCw,
  Search,
  AlertTriangle,
  Sparkles,
  Database,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import type { DocStatus, RawDocument, SourceType } from "../types";

interface DocumentsTabProps {
  documents: RawDocument[];
  totalDocs: number;
  statusFilter: DocStatus | "all";
  setStatusFilter: (s: DocStatus | "all") => void;
  sourceFilter: SourceType | "all";
  setSourceFilter: (s: SourceType | "all") => void;
  onAnalyzeDocument: (id: string) => Promise<void>;
  onAnalyzeAllPending: () => Promise<void>;
  analyzingIds: Set<string>;
  isAnalyzingAll: boolean;
  onLoadSample: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  totalDocs,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  onAnalyzeDocument,
  onAnalyzeAllPending,
  analyzingIds,
  isAnalyzingAll,
  onLoadSample,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const processedCount = documents.filter((d) => d.status === "processed").length;

  const filtered = documents.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.text.toLowerCase().includes(term) ||
      (doc.externalRef && doc.externalRef.toLowerCase().includes(term)) ||
      doc.sourceType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Raw Ingestion Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
              {totalDocs} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Processed: <span className="text-emerald-400 font-semibold">{processedCount}</span> | Pending:{" "}
            <span className="text-amber-400 font-semibold">{pendingCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAnalyzeAllPending}
            disabled={pendingCount === 0 || isAnalyzingAll}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAll ? "animate-spin" : ""}`} />
            <span>
              {isAnalyzingAll
                ? "Analyzing Queue (Max 3 concurrent)..."
                : `Analyze All Pending (${pendingCount})`}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by text or reference ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="feedback">Feedback</option>
            <option value="survey">Survey</option>
            <option value="competitor">Competitor</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No documents found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by importing sample customer feedback, surveys, or competitor notes.
            </p>
            <button
              onClick={onLoadSample}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Load Sample Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Source & Ref</th>
                  <th className="py-3.5 px-4">Raw Content</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filtered.map((doc) => {
                  const isBusy = analyzingIds.has(doc.id) || doc.status === "processing";
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-200 block">
                          {doc.sourceType}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {doc.externalRef || doc.id.slice(-6)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {doc.text}
                        </p>
                        {doc.errorMessage && (
                          <p className="text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>{doc.errorMessage}</span>
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {doc.rating !== null && doc.rating !== undefined ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 text-[11px] font-bold">
                            {doc.rating} ★
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusChip status={doc.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {doc.status !== "processed" ? (
                          <button
                            onClick={() => onAnalyzeDocument(doc.id)}
                            disabled={isBusy}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>{isBusy ? "Running..." : "Analyze"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onAnalyzeDocument(doc.id)}
                            disabled={isBusy}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 transition text-xs cursor-pointer"
                            title="Re-analyze document"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Re-run</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
