import React, { useState } from "react";
import {
  Play,
  Search,
  Sparkles,
  Database,
  FileText,
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
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header Banner */}
      <div className="neo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
              <FileText className="w-5 h-5 stroke-[2.5] text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                  Raw Ingestion Ledger
                </h2>
                <span className="neo-badge bg-[#C4B5FD] text-black text-[11px]">
                  {totalDocs} TOTAL
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs font-bold text-neutral-800">
                <span>
                  PROCESSED:{" "}
                  <span className="px-1.5 py-0.5 bg-[#55E6A5] border border-black rounded text-black font-black">
                    {processedCount}
                  </span>
                </span>
                <span>•</span>
                <span>
                  PENDING QUEUE:{" "}
                  <span className="px-1.5 py-0.5 bg-[#FFE600] border border-black rounded text-black font-black">
                    {pendingCount}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAnalyzeAllPending}
            disabled={pendingCount === 0 || isAnalyzingAll}
            className="neo-btn bg-[#FFE600] text-black px-5 py-3 text-xs uppercase tracking-wider hover:bg-[#FFD600] shadow-[4px_4px_0px_0px_#000000]"
          >
            <Sparkles className={`w-4 h-4 mr-2 stroke-[2.5] ${isAnalyzingAll ? "animate-spin" : ""}`} />
            <span>
              {isAnalyzingAll
                ? "Analyzing Queue (Max 3 Concurrency)..."
                : `Analyze All Pending (${pendingCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neo-card-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by text or external reference..."
            className="neo-input pl-10 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="neo-select"
          >
            <option value="all">ALL STATUSES</option>
            <option value="pending">PENDING</option>
            <option value="processing">PROCESSING</option>
            <option value="processed">PROCESSED</option>
            <option value="failed">FAILED</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="neo-select"
          >
            <option value="all">ALL SOURCES</option>
            <option value="feedback">FEEDBACK</option>
            <option value="survey">SURVEY</option>
            <option value="competitor">COMPETITOR</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="neo-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000000]">
              <Database className="w-8 h-8 stroke-[2.5] text-black" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-black">No documents found</h3>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                Upload some raw data or load sample fixtures to get started.
              </p>
            </div>
            <button
              onClick={onLoadSample}
              className="neo-btn bg-[#FFE600] text-black px-5 py-2.5 text-xs uppercase tracking-wider"
            >
              Load Demo Fixtures
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#FFE600] border-b-[3px] border-black text-black font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 border-r-2 border-black">Source</th>
                  <th className="py-3.5 px-4 border-r-2 border-black w-2/5">Raw Content</th>
                  <th className="py-3.5 px-4 border-r-2 border-black">Reference / Rating</th>
                  <th className="py-3.5 px-4 border-r-2 border-black">Status</th>
                  <th className="py-3.5 px-4 border-r-2 border-black">Ingested At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black bg-white font-medium text-black">
                {filtered.map((doc) => {
                  const isAnalyzing = analyzingIds.has(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#FFFDE6] transition-colors"
                    >
                      <td className="py-3.5 px-4 border-r-2 border-black whitespace-nowrap">
                        <span className="neo-badge bg-[#C4B5FD] text-black text-[10px]">
                          {doc.sourceType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 border-r-2 border-black font-medium text-neutral-900 leading-relaxed">
                        <div className="line-clamp-2">{doc.text}</div>
                        {doc.isDuplicate && (
                          <span className="inline-block mt-1 neo-badge bg-[#FF6B6B] text-black text-[9px] py-0 px-1.5">
                            DUPLICATE HASH
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 border-r-2 border-black whitespace-nowrap font-mono">
                        {doc.externalRef ? (
                          <span className="font-bold">{doc.externalRef}</span>
                        ) : doc.rating !== null && doc.rating !== undefined ? (
                          <span className="font-bold text-amber-800">{doc.rating} ★</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 border-r-2 border-black whitespace-nowrap">
                        <StatusChip status={doc.status} />
                      </td>
                      <td className="py-3.5 px-4 border-r-2 border-black whitespace-nowrap font-mono text-[11px] text-neutral-700">
                        {new Date(doc.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {doc.status === "pending" || doc.status === "failed" ? (
                          <button
                            onClick={() => onAnalyzeDocument(doc.id)}
                            disabled={isAnalyzing}
                            className="neo-btn bg-[#55E6A5] text-black px-3.5 py-1.5 text-[11px] uppercase tracking-wider hover:bg-[#40D695]"
                          >
                            <Play className={`w-3 h-3 mr-1 stroke-[3] ${isAnalyzing ? "animate-spin" : ""}`} />
                            <span>{isAnalyzing ? "Analyzing..." : "Analyze"}</span>
                          </button>
                        ) : doc.status === "processing" ? (
                          <span className="font-mono text-neutral-500 font-bold animate-pulse">Running...</span>
                        ) : (
                          <span className="neo-badge bg-[#55E6A5] text-black text-[10px] py-0.5 px-2">
                            Done
                          </span>
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
