import React, { useState } from 'react';
import { 
  X, 
  Github, 
  Copy, 
  Check, 
  Rocket, 
  Terminal, 
  ExternalLink, 
  Cloud, 
  Server,
  FolderGit2,
  CheckCircle2
} from 'lucide-react';

interface ExportGitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGitHubModal: React.FC<ExportGitHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const gitPushScript = `# 1. Open your terminal in the downloaded project folder:
cd GBMunchV2

# 2. Add your GitHub repository as the remote origin:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/GBMunchV2.git

# 3. Rename branch to main & push your code:
git branch -M main
git push -u origin main`;

  const vercelBuildInstructions = `# Build command:
npm run build

# Output directory:
dist

# Node.js version:
18.x or 20.x`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-['Outfit']">
                Export to GitHub: <span className="text-orange-400">GBMunchV2</span>
              </h3>
              <p className="text-xs text-slate-400">
                Production-ready code prepared for deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Method 1: AI Studio Export Menu (Recommended & Instant) */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 bg-orange-600 text-white rounded-lg text-xs font-bold">
                Option 1
              </span>
              <h4 className="font-black text-slate-900 text-sm font-['Outfit']">
                Export Directly via AI Studio Menu (Instant)
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              You can export this entire working codebase directly to your GitHub repository in one click:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 font-medium bg-white/80 p-3 rounded-xl border border-orange-200/60">
              <li>Click the <strong>Settings / Export</strong> button in the top right menu of Google AI Studio.</li>
              <li>Select <strong>Export to GitHub</strong>.</li>
              <li>Type <code className="bg-orange-100 px-1.5 py-0.5 rounded font-mono text-orange-800 font-bold">GBMunchV2</code> as your destination repository.</li>
              <li>Authenticate your GitHub account and click <strong>Create / Push</strong>.</li>
            </ol>
          </div>

          {/* Method 2: Git CLI Push Commands */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-slate-800 text-white rounded-lg text-xs font-bold">
                  Option 2
                </span>
                <h4 className="font-black text-slate-900 text-sm font-['Outfit'] flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-600" />
                  <span>Push via Git CLI</span>
                </h4>
              </div>

              <button
                onClick={() => copyToClipboard(gitPushScript, 'git')}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              >
                {copiedSection === 'git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {gitPushScript}
            </pre>
          </div>

          {/* Deployment Instructions: Vercel, Netlify, Cloud Run */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <h4 className="font-black text-slate-900 text-sm font-['Outfit'] flex items-center gap-1.5 mb-2">
              <Rocket className="w-4 h-4 text-emerald-600" />
              <span>How to Deploy (Production Ready)</span>
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              This codebase has been cleanly structured with Vite and React 19 so it can be deployed seamlessly to any modern host:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block mb-1">
                  ▲ Deploy to Vercel
                </span>
                <p className="text-[11px] text-slate-600">
                  Connect your GitHub repo <code className="font-bold">GBMunchV2</code> on vercel.com. Vercel automatically detects Vite and runs <code className="bg-slate-200 px-1 rounded">npm run build</code> into <code className="bg-slate-200 px-1 rounded">dist</code>.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block mb-1">
                  🌐 Deploy to Netlify
                </span>
                <p className="text-[11px] text-slate-600">
                  Import from GitHub on netlify.com. Set build command to <code className="bg-slate-200 px-1 rounded">npm run build</code> and publish directory to <code className="bg-slate-200 px-1 rounded">dist</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Repository Target: <strong>alexanderngoc/GBMunchV2</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
