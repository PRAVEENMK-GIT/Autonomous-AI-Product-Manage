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
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../api/client";
import type { ImportResult, SourceType } from "../types";

interface UploadTabProps {
  onUploadSuccess: () => void;
  onLoadSample: () => void;
  isImportingSample: boolean;
  initialText?: string;
  initialSourceType?: SourceType;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  onUploadSuccess,
  onLoadSample,
  isImportingSample,
  initialText,
  initialSourceType,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>(initialSourceType || "feedback");
  const [text, setText] = useState(initialText || "");
  const [rating, setRating] = useState<number | "">("");
  const [externalRef, setExternalRef] = useState("");

  React.useEffect(() => {
    if (initialText !== undefined) {
      setText(initialText);
    }
    if (initialSourceType !== undefined) {
      setSourceType(initialSourceType);
    }
  }, [initialText, initialSourceType]);
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
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="bg-[#C4B5FD] border-[3px] border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] text-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE600] border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Multi-Source Ingestion Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Discovery & Research Ingestion
            </h2>
            <p className="text-sm font-semibold text-neutral-800 max-w-2xl leading-relaxed">
              Upload customer feedback, user survey responses, or competitive intelligence notes.
              Every item is ingested instantly into MongoDB Atlas, flagged for duplicates with SHA-256 hashing, and queued for AI analysis.
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={onLoadSample}
              disabled={isImportingSample}
              className="neo-btn bg-[#FFE600] text-black px-6 py-3.5 text-xs uppercase tracking-wider hover:bg-[#FFD600] shadow-[4px_4px_0px_0px_#000000]"
            >
              <Database className="w-4 h-4 mr-2 stroke-[2.5]" />
              <span>{isImportingSample ? "Loading..." : "Load Demo Fixtures (22 Items)"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single Document Ingestion Card */}
        <div className="neo-card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                  <FileText className="w-4 h-4 stroke-[2.5] text-black" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-black">
                  Single Document Ingestion
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#F4F0EA] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000]">
                &lt; 300ms SLA
              </span>
            </div>

            <form onSubmit={handleSingleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                  Source Type
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["feedback", "survey", "competitor"] as SourceType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setSourceType(type)}
                      className={`neo-btn py-2.5 px-3 text-xs uppercase tracking-wider capitalize ${
                        sourceType === type
                          ? "bg-[#FFE600] text-black shadow-[4px_4px_0px_0px_#000000] -translate-y-0.5"
                          : "bg-white text-neutral-700 shadow-[2px_2px_0px_0px_#000000]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {sourceType === "survey" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Survey Rating (1 to 5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setRating(num)}
                        className={`neo-btn flex-1 py-2 text-xs font-black ${
                          rating === num
                            ? "bg-[#FFD166] text-black shadow-[3px_3px_0px_0px_#000000]"
                            : "bg-white text-neutral-600 shadow-[2px_2px_0px_0px_#000000]"
                        }`}
                      >
                        {num} ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Raw Content / Feedback Text
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${text.length > 9500 ? "text-[#FF6B6B]" : "text-neutral-500"}`}>
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
                  className="neo-input resize-none font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  External Reference (Optional)
                </label>
                <input
                  type="text"
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                  placeholder="e.g. JIRA-402, Intercom #812, Zendesk 90"
                  className="neo-input font-mono text-xs"
                />
              </div>

              {textErrorMessage && (
                <div className="p-3 bg-[#FF6B6B] border-2 border-black rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
                  <span>{textErrorMessage}</span>
                </div>
              )}

              {textSuccessMessage && (
                <div className="p-3 bg-[#55E6A5] border-2 border-black rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]">
                  <CheckCircle className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
                  <span>{textSuccessMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingText}
                className="neo-btn bg-[#FFE600] text-black w-full py-3.5 text-xs uppercase tracking-wider hover:bg-[#FFD600] shadow-[4px_4px_0px_0px_#000000] mt-2"
              >
                <span>{isSubmittingText ? "Ingesting..." : "Save & Queue for Analysis"}</span>
                <ArrowRight className="w-4 h-4 ml-2 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>

        {/* Batch Import Card */}
        <div className="neo-card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#55E6A5] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                  <Upload className="w-4 h-4 stroke-[2.5] text-black" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-black">
                  Batch Import (CSV / JSON / TXT)
                </h3>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[10px] font-black uppercase bg-[#70D6FF] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000]">CSV</span>
                <span className="text-[10px] font-black uppercase bg-[#FFE600] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000]">JSON</span>
                <span className="text-[10px] font-black uppercase bg-[#55E6A5] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000]">TXT</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="border-[3px] border-dashed border-black rounded-2xl p-8 bg-[#FAF7F2] hover:bg-[#FFF9D2] transition-colors flex flex-col items-center justify-center cursor-pointer text-center group shadow-[3px_3px_0px_0px_#000000]">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000] mb-3 group-hover:-translate-y-1 transition-transform">
                  <FileSpreadsheet className="w-7 h-7 stroke-[2.5] text-black" />
                </div>
                <span className="font-black text-sm uppercase tracking-wide text-black">
                  {selectedFile ? selectedFile.name : "Drop CSV, JSON, or TXT file here"}
                </span>
                <span className="text-xs font-bold text-neutral-600 mt-1">
                  Supports bulk items with SHA-256 duplicate detection
                </span>
                <input
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {importError && (
                <div className="p-3 bg-[#FF6B6B] border-2 border-black rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-[#55E6A5] border-2 border-black rounded-xl text-xs font-bold text-black space-y-1 shadow-[3px_3px_0px_0px_#000000]">
                  <div className="flex items-center gap-2 font-black uppercase">
                    <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Import Completed Successfully!</span>
                  </div>
                  <div className="font-mono">
                    Created: <span className="font-black">{importResult.created}</span> | Duplicates Skipped:{" "}
                    <span className="font-black">{importResult.skipped}</span>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-[11px] text-neutral-800">
                      Encountered {importResult.errors.length} skipped row(s).
                    </div>
                  )}
                </div>
              )}

              {/* Table Preview */}
              {previewRows.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                    <span>Parsed Preview ({previewRows.length} rows)</span>
                    <span className="text-[10px] bg-[#FFE600] border border-black px-2 py-0.5 rounded font-black shadow-[1px_1px_0px_0px_#000000]">
                      Ready
                    </span>
                  </div>
                  <div className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_#000000] max-h-48 overflow-y-auto bg-white">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#FFE600] border-b-2 border-black font-black uppercase text-[10px]">
                        <tr>
                          {Object.keys(previewRows[0]).slice(0, 3).map((k) => (
                            <th key={k} className="p-2 border-r border-black last:border-r-0">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-medium">
                        {previewRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF7F2]">
                            {Object.values(row).slice(0, 3).map((v: any, i) => (
                              <td key={i} className="p-2 border-r border-black last:border-r-0 truncate max-w-[150px]">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!selectedFile || isImporting}
                className="neo-btn bg-[#55E6A5] text-black w-full py-3.5 text-xs uppercase tracking-wider hover:bg-[#40D695] shadow-[4px_4px_0px_0px_#000000] disabled:opacity-50 mt-4"
              >
                <FileCheck className="w-4 h-4 mr-2 stroke-[2.5]" />
                <span>{isImporting ? "Processing Batch..." : "Confirm & Import File"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
