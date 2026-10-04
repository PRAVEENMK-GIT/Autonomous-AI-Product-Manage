import React from "react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  BarChart3,
  BookOpen,
  Database,
  Layers,
  HelpCircle,
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
    { id: "guide", label: "How to Use", icon: HelpCircle },
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
    <header className="bg-white border-b-[3px] border-black sticky top-0 z-40 shadow-[0_4px_0px_0px_#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000000] text-black">
              <Layers className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl text-black tracking-tight uppercase">
                  AutoPM
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#C4B5FD] text-black border-2 border-black font-black shadow-[1.5px_1.5px_0px_0px_#000000] uppercase tracking-wider">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-600 tracking-wide">
                Autonomous Product Discovery & Research
              </p>
            </div>
          </div>

          {/* Quick Actions & DB status */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-black bg-[#F4F0EA] px-3.5 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
              <Database className="w-4 h-4 stroke-[2.5]" />
              <span className="uppercase text-[10px] tracking-wider text-neutral-600">DB:</span>
              <span className="flex items-center space-x-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-black ${
                    mongoStatus ? "bg-[#55E6A5]" : "bg-[#FF6B6B]"
                  }`}
                />
                <span className="font-black">
                  {mongoStatus ? "CONNECTED" : "OFFLINE"}
                </span>
              </span>
            </div>

            <button
              onClick={onLoadSampleData}
              disabled={isImportingSample}
              className="neo-btn bg-[#FFE600] text-black px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FFD600]"
            >
              <Sparkles className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>{isImportingSample ? "Importing..." : "Load Demo Data"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Physical Raised Cards */}
        <nav className="flex space-x-2 sm:space-x-3 pb-3 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer whitespace-nowrap border-2 border-black ${
                  isActive
                    ? "bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000000] -translate-y-0.5"
                    : "bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-[#FAF7F2] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000000]"
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1.5 px-2 py-0.5 text-[10px] font-black rounded-md bg-[#FF6B6B] text-black border border-black shadow-[1px_1px_0px_0px_#000000]">
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
