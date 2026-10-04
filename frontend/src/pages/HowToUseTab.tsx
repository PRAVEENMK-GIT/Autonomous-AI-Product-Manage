import React, { useState } from "react";
import {
  Sparkles,
  UploadCloud,
  BarChart3,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Globe,
  Zap,
  CheckCircle2,
  Lightbulb,
  Tag,
  Smile,
  Frown,
  Cpu,
  Shield,
  Layers,
} from "lucide-react";
import type { SourceType } from "../types";

interface HowToUseTabProps {
  onNavigateToTab: (tabId: string) => void;
  onLoadSampleData: () => void;
  onTryExample: (text: string, sourceType: SourceType) => void;
  isImportingSample: boolean;
}

interface ExampleCase {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceLabel: string;
  badgeColor: string;
  rawText: string;
  rating?: number;
  extractedOutcome: {
    summary: string;
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    themes: string[];
    painPoints: string[];
    featureRequests: string[];
  };
}

const SAMPLE_EXAMPLES: ExampleCase[] = [
  {
    id: "churn-interview",
    title: "Enterprise Sales Call Transcript",
    sourceType: "feedback",
    sourceLabel: "Customer Interview",
    badgeColor: "bg-[#C4B5FD]",
    rawText: `Prospect (VP of Product): "We really want to adopt your analytics dashboard across all 150 members of our product engineering team. However, our IT security group has a hard rule: we cannot approve any new vendor tool unless it supports SAML 2.0 / Okta Single Sign-On and granular Role-Based Access Controls (RBAC). Currently, if an engineer leaves the company, our admin has to manually revoke their credentials. Without SCIM provisioning and Okta SSO, this $65,000 annual contract is dead in the water."`,
    extractedOutcome: {
      summary: "Enterprise procurement blocker: Prospect requires Okta SAML 2.0 SSO and SCIM role-based access control to approve a $65k annual contract for 150 users.",
      sentiment: "negative",
      themes: ["Enterprise Security", "User Management & SSO", "Procurement Blockers"],
      painPoints: [
        "Manual user offboarding poses IT security compliance risk",
        "Cannot approve $65,000 contract without Okta SSO support",
      ],
      featureRequests: [
        "SAML 2.0 / Okta Single Sign-On (SSO)",
        "Granular Role-Based Access Controls (RBAC)",
        "SCIM automated user provisioning and de-provisioning",
      ],
    },
  },
  {
    id: "g2-review",
    title: "B2B SaaS G2 User Review",
    sourceType: "feedback",
    sourceLabel: "G2 Review",
    badgeColor: "bg-[#67E8F9]",
    rawText: `Rating: 2/5 Stars. "The AI summary reports are helpful, but exporting reports to CSV or PDF completely freezes and throws a 504 gateway timeout whenever our dataset has more than 20,000 feedback rows. I have to manually copy and paste tables into Google Sheets every Friday to build our leadership deck. Please fix the background export queue!"`,
    extractedOutcome: {
      summary: "High friction in reporting workflow: Exporting datasets over 20k rows to CSV/PDF causes 504 timeouts, forcing manual copy-paste into spreadsheets.",
      sentiment: "negative",
      themes: ["Performance & Reliability", "Reporting & Export", "High Data Volumes"],
      painPoints: [
        "504 gateway timeouts when exporting >20k rows",
        "Users forced to manually copy-paste tables into Google Sheets",
      ],
      featureRequests: [
        "Asynchronous background report export queue",
        "Email delivery link for large CSV/PDF exports",
      ],
    },
  },
  {
    id: "nps-survey",
    title: "Post-Onboarding NPS Survey Feedback",
    sourceType: "survey",
    sourceLabel: "NPS Survey",
    badgeColor: "bg-[#FFE600]",
    rating: 9,
    rawText: `Rating: 9/10 NPS. "The insight extraction is magical — it cuts our user feedback triage time from 4 hours down to 10 minutes. The only thing missing is a direct integration to sync high-priority feature requests automatically into Jira or Linear issues. If you build a Linear integration, this will be our team's #1 daily tool."`,
    extractedOutcome: {
      summary: "Extremely positive reception for AI triage speed (reduced from 4 hours to 10 mins). User strongly desires direct Linear and Jira synchronization.",
      sentiment: "positive",
      themes: ["Issue Tracker Integration", "Triage Efficiency", "Product Evangelism"],
      painPoints: [
        "Manual duplication needed to create engineering tickets from insights",
      ],
      featureRequests: [
        "1-click Jira ticket creation from extracted insights",
        "Native Linear two-way sync for feature requests",
      ],
    },
  },
];

export const HowToUseTab: React.FC<HowToUseTabProps> = ({
  onNavigateToTab,
  onLoadSampleData,
  onTryExample,
  isImportingSample,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentExample = SAMPLE_EXAMPLES[activeExampleIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <section className="neo-card p-6 sm:p-8 bg-gradient-to-br from-[#FFE600] via-[#FFF385] to-[#FFFFFF] relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-black text-white text-xs font-black uppercase tracking-wider mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
            <Zap className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>Interactive User & Viewer Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight uppercase leading-tight mb-3">
            How to Use AutoPM
          </h1>
          <p className="text-base sm:text-lg font-bold text-neutral-800 leading-relaxed mb-6">
            AutoPM is an autonomous product discovery engine. It turns raw, messy customer
            feedback, sales transcripts, and reviews into structured pain points, clustered themes,
            and executive research briefs.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onLoadSampleData}
              disabled={isImportingSample}
              className="neo-btn bg-black text-white hover:bg-neutral-800 px-5 py-2.5 text-xs uppercase tracking-wider font-black shadow-[3px_3px_0px_0px_#FFE600]"
            >
              <Sparkles className="w-4 h-4 mr-2 text-[#FFE600]" />
              <span>{isImportingSample ? "Importing Sample..." : "1-Click Demo Data"}</span>
            </button>
            <button
              onClick={() => onNavigateToTab("upload")}
              className="neo-btn bg-white text-black hover:bg-[#F4F0EA] px-5 py-2.5 text-xs uppercase tracking-wider font-black shadow-[3px_3px_0px_0px_#000000]"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              <span>Start Ingesting Feedback</span>
            </button>
            <button
              onClick={() => onNavigateToTab("insights")}
              className="neo-btn bg-[#C4B5FD] text-black hover:bg-[#B3A1FA] px-5 py-2.5 text-xs uppercase tracking-wider font-black shadow-[3px_3px_0px_0px_#000000]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Explore AI Insights</span>
            </button>
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="hidden lg:block absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
          <Layers className="w-64 h-64 text-black" />
        </div>
      </section>

      {/* Cloudflare Tunnel Note for External Viewers */}
      <section className="neo-card-sm p-4 sm:p-5 bg-[#C4B5FD] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000000]">
            <Globe className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm text-black uppercase tracking-tight">
                Viewing via Cloudflare Tunnel
              </span>
              <span className="bg-[#55E6A5] text-black text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase">
                Active Live Preview
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 mt-0.5">
              This dashboard is securely served from the developer's local machine over a Cloudflare Tunnel. You can interact with all tabs, trigger AI extraction, and test features live in your browser!
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab("upload")}
          className="neo-btn bg-white text-black px-4 py-2 text-xs uppercase font-black shrink-0 hover:bg-[#FAF7F2]"
        >
          <span>Test Ingestion</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </button>
      </section>

      {/* 4-Step Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 bg-[#FFE600] border border-black inline-block shadow-[1px_1px_0px_0px_#000000]"></span>
              The 4-Step AutoPM Workflow
            </h2>
            <p className="text-xs font-bold text-neutral-600 mt-0.5">
              How unstructured text transforms into executive product strategy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="neo-card p-5 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000000]">
                  1
                </span>
                <UploadCloud className="w-5 h-5 text-neutral-700" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tight text-black mb-1.5">
                Ingest & Import
              </h3>
              <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-3">
                Paste raw interview transcripts, customer Zendesk tickets, or batch upload CSV/JSON files.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("upload")}
              className="neo-btn bg-[#F4F0EA] text-black w-full py-1.5 text-[11px] uppercase font-black hover:bg-[#E8E2D8]"
            >
              <span>Go to Upload</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* Step 2 */}
          <div className="neo-card p-5 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#C4B5FD] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000000]">
                  2
                </span>
                <Cpu className="w-5 h-5 text-neutral-700" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tight text-black mb-1.5">
                AI Extraction
              </h3>
              <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-3">
                FastAPI + GenAI parses documents into atomic pain points, sentiment scores, and feature requests.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("documents")}
              className="neo-btn bg-[#F4F0EA] text-black w-full py-1.5 text-[11px] uppercase font-black hover:bg-[#E8E2D8]"
            >
              <span>View Documents</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* Step 3 */}
          <div className="neo-card p-5 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#55E6A5] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000000]">
                  3
                </span>
                <BarChart3 className="w-5 h-5 text-neutral-700" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tight text-black mb-1.5">
                Theme Clustering
              </h3>
              <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-3">
                Clusters isolated data points into recurring themes with evidence quotes and frequency analytics.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("themes")}
              className="neo-btn bg-[#F4F0EA] text-black w-full py-1.5 text-[11px] uppercase font-black hover:bg-[#E8E2D8]"
            >
              <span>Explore Themes</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* Step 4 */}
          <div className="neo-card p-5 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#67E8F9] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000000]">
                  4
                </span>
                <BookOpen className="w-5 h-5 text-neutral-700" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tight text-black mb-1.5">
                Research Briefs
              </h3>
              <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-3">
                Synthesize findings into complete executive PRD briefs, problem statements, and roadmap priorities.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("reports")}
              className="neo-btn bg-[#F4F0EA] text-black w-full py-1.5 text-[11px] uppercase font-black hover:bg-[#E8E2D8]"
            >
              <span>Generate Brief</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Examples Section */}
      <section className="neo-card p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-neutral-600 mb-1">
              <Lightbulb className="w-4 h-4 text-[#FFE600]" />
              <span>Interactive Sandbox Examples</span>
            </div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">
              Real-World Examples & AI Extraction Preview
            </h2>
            <p className="text-xs font-bold text-neutral-600">
              Select an example to see what raw feedback looks like, and what AutoPM's AI engine automatically extracts.
            </p>
          </div>

          {/* Example Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_EXAMPLES.map((eg, idx) => (
              <button
                key={eg.id}
                onClick={() => setActiveExampleIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
                  activeExampleIndex === idx
                    ? `${eg.badgeColor} text-black shadow-[3px_3px_0px_0px_#000000] -translate-y-0.5`
                    : "bg-[#F4F0EA] text-neutral-700 shadow-[1.5px_1.5px_0px_0px_#000000] hover:bg-white"
                }`}
              >
                <span>{eg.sourceLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Example Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Text Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000000] ${currentExample.badgeColor} text-black`}
                >
                  Source: {currentExample.sourceLabel}
                </span>
                <h3 className="font-black text-sm uppercase tracking-tight text-black">
                  Raw Input Text
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(currentExample.rawText, currentExample.id)}
                  className="neo-btn bg-[#F4F0EA] text-black px-2.5 py-1 text-[11px] uppercase font-black hover:bg-white"
                  title="Copy example text"
                >
                  {copiedId === currentExample.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-[#00A86B]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onTryExample(currentExample.rawText, currentExample.sourceType)}
                  className="neo-btn bg-[#FFE600] text-black px-3 py-1 text-[11px] uppercase font-black hover:bg-[#FFD600]"
                  title="Paste into Upload tab and test"
                >
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  <span>Try in Upload Form</span>
                </button>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] font-mono text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap min-h-[180px]">
              {currentExample.rawText}
            </div>

            <p className="text-[11px] font-bold text-neutral-500">
              💡 Tip: Click <strong>"Try in Upload Form"</strong> to immediately populate this example into the Upload & Import form and test real-time AI extraction.
            </p>
          </div>

          {/* Right: Extracted Outcome Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#55E6A5] text-black border border-black shadow-[1px_1px_0px_0px_#000000]">
                  AI Output
                </span>
                <h3 className="font-black text-sm uppercase tracking-tight text-black">
                  Extracted Intelligence
                </h3>
              </div>

              {/* Sentiment badge */}
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border border-black text-[11px] font-black uppercase bg-white shadow-[1px_1px_0px_0px_#000000]">
                {currentExample.extractedOutcome.sentiment === "positive" ? (
                  <>
                    <Smile className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span className="text-[#00A86B]">Positive</span>
                  </>
                ) : (
                  <>
                    <Frown className="w-3.5 h-3.5 text-[#E63946]" />
                    <span className="text-[#E63946]">Negative Sentiment</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] space-y-3 min-h-[180px]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                  Executive Summary:
                </span>
                <p className="text-xs font-bold text-black leading-snug">
                  {currentExample.extractedOutcome.summary}
                </p>
              </div>

              {/* Themes */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                  Identified Product Themes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentExample.extractedOutcome.themes.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] font-black rounded bg-[#F4F0EA] text-black border border-black flex items-center gap-1 shadow-[1px_1px_0px_0px_#000000]"
                    >
                      <Tag className="w-2.5 h-2.5 text-neutral-600" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pain points */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E63946] block mb-1">
                  Extracted Pain Points:
                </span>
                <ul className="space-y-1">
                  {currentExample.extractedOutcome.painPoints.map((p, i) => (
                    <li key={i} className="text-[11px] font-bold text-neutral-800 flex items-start gap-1.5">
                      <span className="text-[#E63946] font-black">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature requests */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00A86B] block mb-1">
                  Identified Feature Desires:
                </span>
                <ul className="space-y-1">
                  {currentExample.extractedOutcome.featureRequests.map((f, i) => (
                    <li key={i} className="text-[11px] font-bold text-neutral-800 flex items-start gap-1.5">
                      <span className="text-[#00A86B] font-black">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices & Pro Tips */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="neo-card p-5 bg-[#FAF7F2] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000000]">
            <CheckCircle2 className="w-4 h-4 text-black" />
          </div>
          <h4 className="font-black text-sm uppercase tracking-tight text-black">
            Raw Quotes Beat Summaries
          </h4>
          <p className="text-xs font-bold text-neutral-700 leading-relaxed">
            Feed the actual customer quotes or verbatim transcripts rather than second-hand summaries. The GenAI prompt is specifically tuned to extract genuine user emotions and severity.
          </p>
        </div>

        <div className="neo-card p-5 bg-[#FAF7F2] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#55E6A5] border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000000]">
            <BarChart3 className="w-4 h-4 text-black" />
          </div>
          <h4 className="font-black text-sm uppercase tracking-tight text-black">
            Batch CSV for Statistical Power
          </h4>
          <p className="text-xs font-bold text-neutral-700 leading-relaxed">
            Upload CSV files of 10 to 50 rows at a time in the "Upload & Import" tab. This provides the "Themes & Evidence" engine with enough statistical weight to uncover true recurring patterns.
          </p>
        </div>

        <div className="neo-card p-5 bg-[#FAF7F2] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#67E8F9] border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000000]">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <h4 className="font-black text-sm uppercase tracking-tight text-black">
            Human-in-the-Loop Review
          </h4>
          <p className="text-xs font-bold text-neutral-700 leading-relaxed">
            In the "Insights Explorer" tab, click the Edit pencil on any insight to refine tags or pain points. AutoPM marks refined items with an "Edited" badge to keep your data audit-ready.
          </p>
        </div>
      </section>
    </div>
  );
};
