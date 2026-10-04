import React, { useState } from "react";
import {
  BookOpen,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Edit2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import type { Report, ReportStatus } from "../types";

interface ReportsTabProps {
  reports: Report[];
  currentReport: Report | null;
  onSelectReport: (report: Report) => void;
  onGenerateReport: (title?: string) => Promise<void>;
  onUpdateReport: (
    id: string,
    update: { title?: string; briefMarkdown?: string; status?: ReportStatus }
  ) => Promise<void>;
  isGenerating: boolean;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  currentReport,
  onSelectReport,
  onGenerateReport,
  onUpdateReport,
  isGenerating,
}) => {
  const [activeView, setActiveView] = useState<"edit" | "preview" | "split">("split");
  const [editedMarkdown, setEditedMarkdown] = useState<string>(
    currentReport ? currentReport.briefMarkdown : ""
  );
  const [editedTitle, setEditedTitle] = useState<string>(
    currentReport ? currentReport.title : "Discovery & Research Brief"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("Discovery & Research Brief");

  const [prevReportKey, setPrevReportKey] = useState<string | null>(null);
  const currentKey = currentReport ? `${currentReport.id}-${currentReport.version}` : null;

  if (currentKey !== prevReportKey) {
    setPrevReportKey(currentKey);
    setEditedMarkdown(currentReport ? currentReport.briefMarkdown : "");
    setEditedTitle(currentReport ? currentReport.title : "Discovery & Research Brief");
  }

  const handleSaveContent = async () => {
    if (!currentReport) return;
    setIsSaving(true);
    try {
      await onUpdateReport(currentReport.id, {
        title: editedTitle,
        briefMarkdown: editedMarkdown,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!currentReport) return;
    setIsSaving(true);
    try {
      await onUpdateReport(currentReport.id, {
        title: editedTitle,
        briefMarkdown: editedMarkdown,
        status: "approved",
      });
      setShowApproveModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDownload = () => {
    if (!currentReport) return;
    const url = api.getExportUrl(currentReport.id);
    window.open(url, "_blank");
  };

  const wordCount = editedMarkdown.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header Banner */}
      <div className="neo-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4B5FD] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
              <BookOpen className="w-5 h-5 stroke-[2.5] text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                  {currentReport ? currentReport.title : "Executive Research Brief"}
                </h2>

                {currentReport && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`neo-badge text-[11px] ${
                        currentReport.status === "approved"
                          ? "bg-[#55E6A5] text-black"
                          : "bg-[#FFE600] text-black"
                      }`}
                    >
                      {currentReport.status === "approved" ? "APPROVED FINAL" : "DRAFT MODE"}
                    </span>
                    <span className="neo-badge bg-[#FAF7F2] text-black text-[10px] font-mono">
                      v{currentReport.version}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs font-bold text-neutral-700 mt-1">
                Synthesized one-page research brief for PRD and stakeholder review. Word count:{" "}
                <span className={`font-mono font-black ${wordCount > 400 ? "text-[#FF6B6B]" : "text-[#008000]"}`}>
                  {wordCount} / 400 words
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {reports.length > 1 && (
            <select
              value={currentReport?.id}
              onChange={(e) => {
                const found = reports.find((r) => r.id === e.target.value);
                if (found) onSelectReport(found);
              }}
              className="neo-select"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.version} — {r.status.toUpperCase()} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowRegenerateModal(true)}
            disabled={isGenerating}
            className="neo-btn bg-white text-black px-3.5 py-2 text-xs uppercase tracking-wider"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 stroke-[2.5] ${isGenerating ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>

          {currentReport && (
            <>
              <button
                onClick={handleSaveContent}
                disabled={isSaving}
                className="neo-btn bg-[#FFE600] text-black px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FFD600]"
              >
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>

              {currentReport.status !== "approved" && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="neo-btn bg-[#55E6A5] text-black px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#40D695]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                  <span>Approve Final</span>
                </button>
              )}

              <button
                onClick={handleExportDownload}
                className="neo-btn bg-[#C4B5FD] text-black px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#A78BFA]"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                <span>Export (.md)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!currentReport ? (
        <div className="neo-card p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#C4B5FD] border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000000]">
            <BookOpen className="w-8 h-8 stroke-[2.5] text-black" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-black">No Research Brief Generated Yet</h3>
            <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto mt-1">
              Synthesize all processed customer inputs, code-ranked themes, and competitor teardowns into an executive brief.
            </p>
          </div>
          <button
            onClick={() => onGenerateReport()}
            disabled={isGenerating}
            className="neo-btn bg-[#FFE600] text-black px-6 py-3.5 text-xs uppercase tracking-wider hover:bg-[#FFD600] shadow-[4px_4px_0px_0px_#000000]"
          >
            <Sparkles className="w-4 h-4 mr-2 stroke-[2.5]" />
            <span>{isGenerating ? "Synthesizing Brief..." : "Generate Research Brief"}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentReport.status === "draft" && (
            <div className="p-4 bg-[#FFE600] border-2 border-black rounded-xl text-xs font-bold text-black flex items-center justify-between shadow-[3px_3px_0px_0px_#000000]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
                <span>
                  <strong>Draft Version:</strong> Review and refine this executive brief before sign-off. Approving it locks an audit timestamp.
                </span>
              </div>
              <button
                onClick={() => setShowApproveModal(true)}
                className="neo-btn bg-black text-white px-3 py-1 text-[11px] uppercase tracking-wider hover:bg-neutral-800"
              >
                Approve Now
              </button>
            </div>
          )}

          {/* Title and View Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="neo-input font-black text-base uppercase tracking-tight max-w-md"
            />

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
              <button
                onClick={() => setActiveView("edit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeView === "edit" ? "bg-[#FFE600] text-black border border-black" : "text-black hover:bg-[#FAF7F2]"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveView("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeView === "preview" ? "bg-[#FFE600] text-black border border-black" : "text-black hover:bg-[#FAF7F2]"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveView("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer hidden md:block ${
                  activeView === "split" ? "bg-[#FFE600] text-black border border-black" : "text-black hover:bg-[#FAF7F2]"
                }`}
              >
                Split View
              </button>
            </div>
          </div>

          {/* Split Pane Editor & Formatted Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeView === "edit" || activeView === "split") && (
              <div
                className={`neo-card p-5 flex flex-col justify-between ${
                  activeView === "edit" ? "md:col-span-2" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black text-xs font-black uppercase tracking-wider text-black">
                    <span className="flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Markdown Source</span>
                    </span>
                    <span className="font-mono text-[11px] text-neutral-600">one-page limit: 400w</span>
                  </div>
                  <textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    rows={22}
                    className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-4 text-xs font-mono font-medium text-black focus:outline-none focus:shadow-[4px_4px_0px_0px_#000000] resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {(activeView === "preview" || activeView === "split") && (
              <div
                className={`neo-card p-6 overflow-y-auto max-h-[640px] bg-[#FAF7F2] ${
                  activeView === "preview" ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black text-xs font-black uppercase tracking-wider text-black">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Formatted Executive Brief</span>
                  </span>
                  <span className="neo-badge bg-[#55E6A5] text-black text-[10px] py-0.5 px-2">
                    Ready For Sign-Off
                  </span>
                </div>

                <div className="space-y-4 text-black font-sans">
                  {editedMarkdown.split("\n\n").map((block, idx) => {
                    if (block.startsWith("# ")) {
                      return (
                        <h1 key={idx} className="text-xl font-black uppercase tracking-tight text-black border-b-2 border-black pb-2">
                          {block.replace("# ", "")}
                        </h1>
                      );
                    }
                    if (block.startsWith("## ")) {
                      return (
                        <h2 key={idx} className="text-sm font-black uppercase tracking-wider text-black pt-3 pb-1 border-b border-neutral-300">
                          {block.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (block.startsWith("> ")) {
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-[4px] border-black pl-3.5 py-2 italic text-neutral-900 text-xs bg-white border-2 border-black rounded-r-xl shadow-[2px_2px_0px_0px_#000000]"
                        >
                          {block.replace("> ", "")}
                        </blockquote>
                      );
                    }
                    if (block.startsWith("- ")) {
                      const items = block.split("\n- ").map((item) => item.replace("- ", ""));
                      return (
                        <ul key={idx} className="space-y-1.5 text-xs text-neutral-900 pl-2">
                          {items.map((it, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-black font-black text-sm">•</span>
                              <span className="leading-snug">{it}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs font-medium text-neutral-900 leading-relaxed">
                        {block}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFFDF5] border-[3px] border-black rounded-2xl w-full max-w-md p-6 shadow-[10px_10px_0px_0px_#000000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#55E6A5] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
                <FileCheck className="w-6 h-6 stroke-[2.5] text-black" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black">
                  Approve Research Brief?
                </h3>
                <p className="text-xs font-bold text-neutral-600">Formal sign-off for Objective 1 deliverable</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-neutral-800 leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-black">
              Approving marks this version as final and records a permanent timestamp for downstream PRD generation. Any subsequent manual edits will return it back to draft status.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="neo-btn bg-white text-black px-4 py-2 text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="neo-btn bg-[#55E6A5] text-black px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#40D695]"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFFDF5] border-[3px] border-black rounded-2xl w-full max-w-md p-6 shadow-[10px_10px_0px_0px_#000000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
                <RotateCw className="w-6 h-6 stroke-[2.5] text-black" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black">
                  Regenerate Research Brief?
                </h3>
                <p className="text-xs font-bold text-neutral-600">Creates a new version from current insights</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Report Title
              </label>
              <input
                type="text"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                className="neo-input"
              />
            </div>

            <p className="text-xs font-semibold text-neutral-700 leading-relaxed">
              This will recompute themes and generate a new version. The previous version (v{currentReport?.version}) remains archived in history.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="neo-btn bg-white text-black px-4 py-2 text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onGenerateReport(newReportTitle);
                  setShowRegenerateModal(false);
                }}
                className="neo-btn bg-[#FFE600] text-black px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#FFD600]"
              >
                Generate Next Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
