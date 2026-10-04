import React, { useState } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";
import { api } from "../api/client";
import type { ImportResult, SourceType } from "../types";

interface UploadTabProps {
  onUploadSuccess: () => void;
  onLoadSample: () => void;
  isImportingSample: boolean;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  onUploadSuccess,
  onLoadSample,
  isImportingSample,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>("feedback");
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [externalRef, setExternalRef] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [textSuccessMessage, setTextSuccessMessage] = useState<string | null>(null);
  const [textErrorMessage, setTextErrorMessage] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setTextErrorMessage("Text cannot be empty.");
      return;
    }
    if (text.length > 10000) {
      setTextErrorMessage("Text exceeds maximum 10,000 characters limit.");
      return;
    }

    setIsSubmittingText(true);
    setTextSuccessMessage(null);
    setTextErrorMessage(null);

    try {
      const res = await api.createDocument({
        sourceType,
        text,
        rating: sourceType === "survey" && rating !== "" ? Number(rating) : null,
        externalRef: externalRef || undefined,
      });

      setText("");
      setRating("");
      setExternalRef("");
      setTextSuccessMessage(
        `Document saved successfully (ID: ${res.id}). Queued as pending.`
      );
      onUploadSuccess();
    } catch (err: any) {
      setTextErrorMessage(err.message || "Failed to upload document.");
    } finally {
      setIsSubmittingText(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);
    setImportError(null);

    const textContent = await file.text();
    const filename = file.name.toLowerCase();

    try {
      if (filename.endsWith(".json")) {
        const parsed = JSON.parse(textContent);
        if (Array.isArray(parsed)) {
          setPreviewRows(parsed.slice(0, 10));
        } else {
          setImportError("JSON file must contain an array of objects.");
        }
      } else if (filename.endsWith(".csv")) {
        const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
          const rows = lines.slice(1, 11).map((line) => {
            const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || "";
            });
            return obj;
          });
          setPreviewRows(rows);
        }
      } else {
        const blocks = textContent.split(/\n\n+/).filter((b) => b.trim().length > 0);
        setPreviewRows(blocks.slice(0, 10).map((b, i) => ({ row: i + 1, text: b.slice(0, 150) + "..." })));
      }
    } catch {
      setImportError("Could not parse file for preview.");
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await api.importFile(formData);
      setImportResult(result);
      setSelectedFile(null);
      setPreviewRows([]);
      onUploadSuccess();
    } catch (err: any) {
      setImportError(err.message || "Failed to import file.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/30 rounded-2xl border border-indigo-900/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Discovery & Research Ingestion</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Upload customer feedback, user survey responses, or competitive intelligence notes.
              Every item is ingested instantly into MongoDB Atlas, flagged for duplicates, and queued for AI analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLoadSample}
              disabled={isImportingSample}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isImportingSample ? "Loading..." : "Load Demo Fixtures"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Single Document Ingestion</h3>
          </div>

          <form onSubmit={handleSingleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Source Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["feedback", "survey", "competitor"] as SourceType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setSourceType(type)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${
                      sourceType === type
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {sourceType === "survey" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Survey Rating (1 to 5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setRating(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        rating === num
                          ? "bg-purple-600 text-white border-purple-500"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Raw Content / Feedback Text
                </label>
                <span className={`text-xs ${text.length > 9500 ? "text-rose-400 font-bold" : "text-slate-500"}`}>
                  {text.length} / 10,000
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste customer quote, survey open-text answer, or competitor note here..."
                rows={6}
                maxLength={10000}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                External Reference (Optional)
              </label>
              <input
                type="text"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="e.g. JIRA-402, Intercom #812, Zendesk 90"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {textSuccessMessage && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{textSuccessMessage}</span>
              </div>
            )}

            {textErrorMessage && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{textErrorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingText}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <span>{isSubmittingText ? "Ingesting..." : "Save & Queue for Analysis"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
              <Upload className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Batch Import (CSV / JSON / TXT)</h3>
            </div>

            <div className="mt-5">
              <label
                htmlFor="file-drop"
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition"
              >
                <Upload className="w-10 h-10 text-indigo-400 mb-3" />
                <span className="text-sm font-medium text-slate-200">
                  {selectedFile ? selectedFile.name : "Drop CSV, JSON, or TXT file here"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports bulk feedback with automatic deduplication
                </span>
                <input
                  id="file-drop"
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {previewRows.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>File Preview (First {previewRows.length} Rows)</span>
                  </h4>
                  <span className="text-xs text-indigo-400 font-medium">Ready to import</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="p-1.5">#</th>
                        <th className="p-1.5">Content Sample</th>
                        <th className="p-1.5">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {previewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-1.5 text-slate-500">{i + 1}</td>
                          <td className="p-1.5 text-slate-200 truncate max-w-xs">
                            {r.text || r.content || JSON.stringify(r)}
                          </td>
                          <td className="p-1.5 text-slate-400">{r.sourceType || "auto"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs space-y-1 text-emerald-300">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Import Completed</span>
                </div>
                <p>Created: <span className="font-bold text-white">{importResult.created}</span> documents</p>
                <p>Duplicates Skipped: <span className="font-bold text-white">{importResult.skipped}</span></p>
                {importResult.errors.length > 0 && (
                  <p className="text-rose-400">Errors: {importResult.errors.length} rows failed</p>
                )}
              </div>
            )}

            {importError && (
              <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleImportSubmit}
              disabled={!selectedFile || isImporting}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
            >
              <span>{isImporting ? "Processing Import..." : "Confirm & Import File"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
