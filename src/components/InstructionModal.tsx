import React, { useState } from "react";
import { Check, Copy, Info, ExternalLink, HelpCircle, FileText, ArrowRight, Server, CheckCircle } from "lucide-react";
import appsScriptCode from "../assets/apps-script/Code.gs?raw";

export default function InstructionModal() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="instruction-card" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
            Google Sheets Integration Guide
          </h3>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Follow these 6 simple steps to connect and use your own Google Sheet as a free database.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Step 1 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            1
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Create a New Spreadsheet</p>
            <p className="mt-0.5 text-slate-500">
              Create a new Google Sheet and write these column names exactly in the first row:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
               {["ID", "Grade", "Subject", "Chapter", "Topic", "Type", "Link"].map((col) => (
                <span key={col} className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1 font-mono text-[10px] text-slate-700 font-semibold shadow-2xs">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            2
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Open Google Apps Script</p>
            <p className="mt-0.5 text-slate-500">
              On the top menu of your Google Sheet, click <span className="font-semibold text-blue-600">Extensions</span> &gt; <span className="font-semibold text-blue-600">Apps Script</span>.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            3
          </div>
          <div className="flex-1 text-xs sm:text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">Copy and Paste the Apps Script Code</p>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all shadow-xs ${
                  copied 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <p className="mt-1 text-slate-500">
              Delete all default code inside the Apps Script editor, then paste this code:
            </p>

            <div className="relative mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 leading-relaxed shadow-inner">
              <pre>{appsScriptCode}</pre>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            4
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Deploy as a Web App</p>
            <p className="mt-0.5 text-slate-500">
              Click the <span className="font-semibold text-slate-900">Deploy</span> &gt; <span className="font-semibold text-slate-900">New Deployment</span> button on the top right corner.
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            5
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Set Access Permissions to "Anyone"</p>
            <p className="mt-0.5 text-slate-500">
              Configure the deployment settings with the following values (VERY IMPORTANT!):
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-500">
              <li>Select type: <span className="font-semibold text-slate-800">Web App</span></li>
              <li>Execute as: <span className="font-semibold text-slate-800">Me (your email address)</span></li>
              <li>Who has access: <span className="font-semibold text-emerald-600">Anyone</span></li>
            </ul>
            <p className="mt-2 text-slate-400 text-[11px]">
              *Note: When deploying for the first time, Google will prompt you to authorize permissions. Choose your Google account and grant permission.
            </p>
          </div>
        </div>

        {/* Step 6 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            6
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Paste the Web App URL Above</p>
            <p className="mt-0.5 text-slate-500">
              Once successfully deployed, copy the provided <span className="font-semibold text-blue-600">Web App URL</span>, paste it into the input field above, and click "Save Database URL".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
