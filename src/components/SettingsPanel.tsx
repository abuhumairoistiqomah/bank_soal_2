import React, { useState } from "react";
import { Database, Link2, Check, AlertCircle, RefreshCw, Sparkles, ServerCrash } from "lucide-react";
import InstructionModal from "./InstructionModal";

interface SettingsPanelProps {
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onTestConnection: () => Promise<boolean>;
  testing: boolean;
  testResult: { success: boolean; message: string } | null;
}

export default function SettingsPanel({
  gasUrl,
  onSaveGasUrl,
  onTestConnection,
  testing,
  testResult,
}: SettingsPanelProps) {
  const [inputValue, setInputValue] = useState(gasUrl);
  const [validationError, setValidationError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const url = inputValue.trim();
    if (url && !url.startsWith("https://script.google.com/")) {
      setValidationError("Google Apps Script URL must start with 'https://script.google.com/'");
      return;
    }

    onSaveGasUrl(url);
  };

  const handleTest = async () => {
    if (!gasUrl) {
      setValidationError("Please save the Apps Script URL before testing the connection.");
      return;
    }
    await onTestConnection();
  };

  return (
    <div id="settings-panel-container" className="space-y-8">
      {/* Configuration Box */}
      <div id="gas-config-card" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Connect to Google Sheets
            </h3>
            <p className="text-xs text-slate-500">
              Configure Google Sheets integration using Google Apps Script Web App.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="gas-url-input" className="text-xs font-bold text-slate-700">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                id="gas-url-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>
            {validationError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {validationError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 cursor-pointer"
            >
              Save Database URL
            </button>

            {gasUrl && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-3xs cursor-pointer"
              >
                {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {testing ? "Testing Connection..." : "Test Database Connection"}
              </button>
            )}
          </div>
        </form>

        {/* Display Connection Test Result */}
        {testResult && (
          <div
            id="test-result-alert"
            className={`rounded-xl border p-4 text-xs sm:text-sm ${
              testResult.success
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-rose-100 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {testResult.success ? "Connection Success!" : "Connection Failed!"}
                </p>
                <p className="text-xs opacity-90 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Connection Status Info */}
        <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-700">Active Data Source:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {gasUrl 
                ? "Connected to your live external Google Apps Script API" 
                : "Using built-in local seeded data because no custom URL has been saved"}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-center self-start sm:self-auto ${
            gasUrl 
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
              : "bg-slate-100 text-slate-800 border border-slate-200"
          }`}>
            {gasUrl ? "Live Sheet Connected" : "Local Data Mode"}
          </span>
        </div>
      </div>

      {/* Guide/Instruction Component */}
      <InstructionModal />
    </div>
  );
}
