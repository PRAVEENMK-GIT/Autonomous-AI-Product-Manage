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
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>{currentReport ? currentReport.title : "Executive Research Brief"}</span>
            </h2>

            {currentReport && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    currentReport.status === "approved"
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
                      : "bg-amber-950/70 text-amber-300 border-amber-800"
                  }`}
                >
                  {currentReport.status === "approved" ? "APPROVED" : "DRAFT"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  v{currentReport.version}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Synthesized one-page research brief for PRD and stakeholder review. Word count:{" "}
            <span className={wordCount > 400 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {wordCount} / 400 words
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {reports.length > 1 && (
            <select
              value={currentReport?.id}
              onChange={(e) => {
                const found = reports.find((r) => r.id === e.target.value);
                if (found) onSelectReport(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>

          {currentReport && (
            <>
              <button
                onClick={handleSaveContent}
                disabled={isSaving}
                className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <span>Save Changes</span>
              </button>

              {currentReport.status !== "approved" && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Final</span>
                </button>
              )}

              <button
                onClick={handleExportDownload}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.md)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!currentReport ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No Research Brief Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Generate an executive one-page brief synthesizing all processed documents, top themes, and competitor findings.
          </p>
          <button
            onClick={() => onGenerateReport()}
            disabled={isGenerating}
            className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? "Synthesizing Brief..." : "Generate Research Brief"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentReport.status === "draft" && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Draft Status:</strong> Any edits return an approved brief back to draft. Please review and approve before distributing to stakeholders.
                </span>
              </div>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
              >
                Approve Now
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="bg-transparent text-lg font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
            />

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveView("edit")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeView === "edit" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveView("preview")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeView === "preview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveView("split")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer hidden md:block ${
                  activeView === "split" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Split View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeView === "edit" || activeView === "split") && (
              <div
                className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg ${
                  activeView === "edit" ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Markdown Source</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">one-page limit: 400w</span>
                </div>
                <textarea
                  value={editedMarkdown}
                  onChange={(e) => setEditedMarkdown(e.target.value)}
                  rows={22}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {(activeView === "preview" || activeView === "split") && (
              <div
                className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg overflow-y-auto max-h-[600px] ${
                  activeView === "preview" ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Formatted Executive Brief</span>
                  </span>
                  <span className="text-emerald-400 font-medium">Ready for review</span>
                </div>

                <div className="prose prose-invert prose-xs max-w-none text-slate-200 space-y-4">
                  {editedMarkdown.split("\n\n").map((block, idx) => {
                    if (block.startsWith("# ")) {
                      return (
                        <h1 key={idx} className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                          {block.replace("# ", "")}
                        </h1>
                      );
                    }
                    if (block.startsWith("## ")) {
                      return (
                        <h2 key={idx} className="text-sm font-bold text-indigo-300 pt-2">
                          {block.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (block.startsWith("> ")) {
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-2 border-indigo-500 pl-3 italic text-slate-300 text-xs bg-slate-950/40 p-2 rounded-r-lg"
                        >
                          {block.replace("> ", "")}
                        </blockquote>
                      );
                    }
                    if (block.startsWith("- ")) {
                      const items = block.split("\n- ").map((item) => item.replace("- ", ""));
                      return (
                        <ul key={idx} className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                          {items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs text-slate-300 leading-relaxed">
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

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Research Brief?</h3>
                <p className="text-xs text-slate-400">Formal sign-off for Objective 1 deliverable</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Approving marks this version as final and records a permanent timestamp. Any subsequent edits to the brief will return it back to draft status.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Regenerate Research Brief?</h3>
                <p className="text-xs text-slate-400">Creates a new version from current insights</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This will recompute themes and generate a new version. The previous version (v{currentReport?.version}) remains archived in history.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onGenerateReport(newReportTitle);
                  setShowRegenerateModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
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
