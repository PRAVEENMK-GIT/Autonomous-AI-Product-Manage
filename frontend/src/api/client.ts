import type {
  DocStatus,
  ImportResult,
  Insight,
  RawDocument,
  Report,
  ReportStatus,
  Sentiment,
  SourceType,
  ThemeStat,
} from "../types";
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errorDetail = data.detail;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  getHealth: async (): Promise<{ status: string; mongo: boolean }> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  getDocuments: async (params?: {
    status?: DocStatus;
    sourceType?: SourceType;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: RawDocument[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.sourceType) query.append("sourceType", params.sourceType);
    if (params?.page) query.append("page", String(params.page));
    if (params?.pageSize) query.append("pageSize", String(params.pageSize));

    const res = await fetch(`${API_BASE}/documents?${query.toString()}`);
    return handleResponse(res);
  },

  getDocument: async (id: string): Promise<RawDocument> => {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    return handleResponse(res);
  },

  createDocument: async (payload: {
    sourceType: SourceType;
    text: string;
    rating?: number | null;
    externalRef?: string;
  }): Promise<RawDocument> => {
    const res = await fetch(`${API_BASE}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  importFile: async (formData: FormData, defaultSource?: SourceType): Promise<ImportResult> => {
    const query = defaultSource ? `?default_source_type=${defaultSource}` : "";
    const res = await fetch(`${API_BASE}/documents/import${query}`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(res);
  },

  loadSampleData: async (): Promise<ImportResult> => {
    const res = await fetch(`${API_BASE}/documents/load-sample`, {
      method: "POST",
    });
    return handleResponse(res);
  },

  analyzeDocument: async (id: string, stub: boolean = false): Promise<{ id: string; status: DocStatus }> => {
    const res = await fetch(`${API_BASE}/documents/${id}/analyze?stub=${stub}`, {
      method: "POST",
    });
    return handleResponse(res);
  },

  analyzePending: async (stub: boolean = false): Promise<{ queued: number }> => {
    const res = await fetch(`${API_BASE}/documents/analyze-pending?stub=${stub}`, {
      method: "POST",
    });
    return handleResponse(res);
  },

  getInsights: async (params?: {
    theme?: string;
    sentiment?: Sentiment;
    sourceType?: SourceType;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Insight[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.theme) query.append("theme", params.theme);
    if (params?.sentiment) query.append("sentiment", params.sentiment);
    if (params?.sourceType) query.append("sourceType", params.sourceType);
    if (params?.page) query.append("page", String(params.page));
    if (params?.pageSize) query.append("pageSize", String(params.pageSize));

    const res = await fetch(`${API_BASE}/insights?${query.toString()}`);
    return handleResponse(res);
  },

  getInsight: async (id: string): Promise<Insight> => {
    const res = await fetch(`${API_BASE}/insights/${id}`);
    return handleResponse(res);
  },

  updateInsight: async (id: string, update: Partial<Insight>): Promise<Insight> => {
    const res = await fetch(`${API_BASE}/insights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return handleResponse(res);
  },

  getThemes: async (limit: number = 20, examples: number = 2): Promise<{ data: ThemeStat[]; totalDocs: number }> => {
    const res = await fetch(`${API_BASE}/themes?limit=${limit}&examples=${examples}`);
    return handleResponse(res);
  },

  getReports: async (): Promise<{ data: Report[]; total: number }> => {
    const res = await fetch(`${API_BASE}/reports`);
    return handleResponse(res);
  },

  getReport: async (id: string): Promise<Report> => {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    return handleResponse(res);
  },

  generateReport: async (title?: string, stub: boolean = false): Promise<Report> => {
    const res = await fetch(`${API_BASE}/reports/generate?stub=${stub}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Discovery & Research Brief" }),
    });
    return handleResponse(res);
  },

  updateReport: async (
    id: string,
    update: { title?: string; briefMarkdown?: string; status?: ReportStatus }
  ): Promise<Report> => {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return handleResponse(res);
  },

  getExportUrl: (id: string): string => {
    return `${API_BASE}/reports/${id}/export?format=md`;
  },
};
