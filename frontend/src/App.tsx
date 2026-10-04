import React, { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api/client";
import { Navbar } from "./components/Navbar";
import { DocumentsTab } from "./pages/DocumentsTab";
import { InsightsTab } from "./pages/InsightsTab";
import { ReportsTab } from "./pages/ReportsTab";
import { ThemesTab } from "./pages/ThemesTab";
import { UploadTab } from "./pages/UploadTab";
import type { DocStatus, Insight, Report, ReportStatus, Sentiment, SourceType } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const AppContent: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Filtering states
  const [docStatusFilter, setDocStatusFilter] = useState<DocStatus | "all">("all");
  const [docSourceFilter, setDocSourceFilter] = useState<SourceType | "all">("all");
  const [insightThemeFilter, setInsightThemeFilter] = useState<string>("");
  const [insightSentimentFilter, setInsightSentimentFilter] = useState<Sentiment | "all">("all");
  const [insightSourceFilter, setInsightSourceFilter] = useState<SourceType | "all">("all");

  // Local state for active analysis tracking
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Health Query
  const { data: healthData } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.getHealth(),
    refetchInterval: 15000,
  });

  // 2. Documents Query (Auto-polls every 3s if any doc is pending or processing!)
  const { data: docsResponse } = useQuery({
    queryKey: ["documents", docStatusFilter, docSourceFilter],
    queryFn: () =>
      api.getDocuments({
        status: docStatusFilter !== "all" ? docStatusFilter : undefined,
        sourceType: docSourceFilter !== "all" ? docSourceFilter : undefined,
      }),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.data.some(
        (d) => d.status === "pending" || d.status === "processing"
      );
      return hasActive ? 3000 : false;
    },
  });

  const documents = docsResponse?.data || [];
  const totalDocs = docsResponse?.total || 0;
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  // 3. Insights Query
  const { data: insightsResponse, isLoading: isLoadingInsights } = useQuery({
    queryKey: ["insights", insightThemeFilter, insightSentimentFilter, insightSourceFilter],
    queryFn: () =>
      api.getInsights({
        theme: insightThemeFilter || undefined,
        sentiment: insightSentimentFilter !== "all" ? insightSentimentFilter : undefined,
        sourceType: insightSourceFilter !== "all" ? insightSourceFilter : undefined,
      }),
  });

  const insights = insightsResponse?.data || [];
  const totalInsights = insightsResponse?.total || 0;

  // 4. Themes Query
  const { data: themesResponse } = useQuery({
    queryKey: ["themes"],
    queryFn: () => api.getThemes(20, 2),
  });

  const themeStats = themesResponse?.data || [];

  // 5. Reports Query
  const { data: reportsResponse } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.getReports(),
  });

  const reports = reportsResponse?.data || [];
  const currentReport = selectedReport || (reports.length > 0 ? reports[0] : null);

  // Load sample fixtures mutation
  const loadSampleMutation = useMutation({
    mutationFn: () => api.loadSampleData(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      showToast(`Loaded sample fixtures: ${res.created} created, ${res.skipped} skipped.`);
      setActiveTab("documents");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to load sample data", "error");
    },
  });

  // Analyze single document
  const handleAnalyzeDocument = async (id: string) => {
    setAnalyzingIds((prev) => new Set(prev).add(id));
    try {
      await api.analyzeDocument(id, true);
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["themes"] });
      showToast("Document analysis complete!");
    } catch (err: any) {
      showToast(err.message || "Analysis failed", "error");
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Analyze all pending
  const handleAnalyzeAllPending = async () => {
    setIsAnalyzingAll(true);
    try {
      const res = await api.analyzePending(true);
      showToast(`Queued ${res.queued} documents for analysis.`);
      qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      showToast(err.message || "Failed to trigger queue analysis", "error");
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  // Update insight
  const handleUpdateInsight = async (id: string, updated: Partial<Insight>) => {
    try {
      await api.updateInsight(id, updated);
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["themes"] });
      showToast("Insight updated successfully.");
    } catch (err: any) {
      showToast(err.message || "Failed to update insight", "error");
      throw err;
    }
  };

  // Generate report
  const handleGenerateReport = async (title?: string) => {
    try {
      const newRep = await api.generateReport(title, true);
      qc.invalidateQueries({ queryKey: ["reports"] });
      setSelectedReport(newRep);
      showToast(`Research brief generated (version ${newRep.version})!`);
    } catch (err: any) {
      showToast(err.message || "Failed to generate report", "error");
    }
  };

  // Update report
  const handleUpdateReport = async (
    id: string,
    update: { title?: string; briefMarkdown?: string; status?: ReportStatus }
  ) => {
    try {
      const updated = await api.updateReport(id, update);
      qc.invalidateQueries({ queryKey: ["reports"] });
      setSelectedReport(updated);
      showToast(
        update.status === "approved"
          ? "Report officially approved!"
          : "Report changes saved."
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update report", "error");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        mongoStatus={healthData?.mongo ?? false}
        onLoadSampleData={() => loadSampleMutation.mutate()}
        isImportingSample={loadSampleMutation.isPending}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "upload" && (
          <UploadTab
            onUploadSuccess={() => {
              qc.invalidateQueries({ queryKey: ["documents"] });
              showToast("Document saved. Switched to Documents view.");
              setActiveTab("documents");
            }}
            onLoadSample={() => loadSampleMutation.mutate()}
            isImportingSample={loadSampleMutation.isPending}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            documents={documents}
            totalDocs={totalDocs}
            statusFilter={docStatusFilter}
            setStatusFilter={setDocStatusFilter}
            sourceFilter={docSourceFilter}
            setSourceFilter={setDocSourceFilter}
            onAnalyzeDocument={handleAnalyzeDocument}
            onAnalyzeAllPending={handleAnalyzeAllPending}
            analyzingIds={analyzingIds}
            isAnalyzingAll={isAnalyzingAll}
            onLoadSample={() => loadSampleMutation.mutate()}
          />
        )}

        {activeTab === "insights" && (
          <InsightsTab
            insights={insights}
            totalInsights={totalInsights}
            isLoading={isLoadingInsights}
            selectedTheme={insightThemeFilter}
            setSelectedTheme={setInsightThemeFilter}
            selectedSentiment={insightSentimentFilter}
            setSelectedSentiment={setInsightSentimentFilter}
            selectedSource={insightSourceFilter}
            setSelectedSource={setInsightSourceFilter}
            onUpdateInsight={handleUpdateInsight}
            onClearFilters={() => {
              setInsightThemeFilter("");
              setInsightSentimentFilter("all");
              setInsightSourceFilter("all");
            }}
          />
        )}

        {activeTab === "themes" && (
          <ThemesTab
            themeStats={themeStats}
            totalDocs={totalInsights}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            reports={reports}
            currentReport={currentReport}
            onSelectReport={(r) => setSelectedReport(r)}
            onGenerateReport={handleGenerateReport}
            onUpdateReport={handleUpdateReport}
            isGenerating={false}
          />
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border flex items-center gap-2 ${
              toastMessage.type === "success"
                ? "bg-slate-900 text-emerald-400 border-emerald-800/80 shadow-emerald-950/50"
                : "bg-slate-900 text-rose-400 border-rose-800/80 shadow-rose-950/50"
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
