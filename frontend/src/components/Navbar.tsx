import React from "react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  BarChart3,
  BookOpen,
  Database,
  Layers,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  mongoStatus: boolean;
  onLoadSampleData: () => void;
  isImportingSample: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  mongoStatus,
  onLoadSampleData,
  isImportingSample,
}) => {
  const tabs = [
    { id: "upload", label: "Upload & Import", icon: UploadCloud },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: "insights", label: "Insights Explorer", icon: Sparkles },
    { id: "themes", label: "Themes & Evidence", icon: BarChart3 },
    { id: "reports", label: "Research Brief", icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  AutoPM
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  Discovery & Research MVP
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Product Manager Engine</p>
            </div>
          </div>

          {/* Quick Actions & DB status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>DB:</span>
              <span className="flex items-center space-x-1 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    mongoStatus ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                <span className={mongoStatus ? "text-emerald-400" : "text-rose-400"}>
                  {mongoStatus ? "Connected" : "Offline"}
                </span>
              </span>
            </div>

            <button
              onClick={onLoadSampleData}
              disabled={isImportingSample}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isImportingSample ? "Importing..." : "Load Sample Data"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-indigo-500 text-indigo-400 font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
