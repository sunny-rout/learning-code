import React, { useState } from 'react';
import { ContentBlock } from '@/types/lesson';
import { LessonDiagram } from './LessonDiagram';
import { 
  CheckCircle2, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Terminal, 
  Copy, 
  Check, 
  ShieldAlert,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface ContentBlockRendererProps {
  block: ContentBlock;
  lessonId: string;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ block, lessonId: _lessonId }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          setCopiedCode(code);
          setTimeout(() => setCopiedCode(null), 2000);
        }).catch(() => {
          // Fallback
          fallbackCopyText(code);
        });
      } else {
        fallbackCopyText(code);
      }
    } catch {
      fallbackCopyText(code);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.warn('Fallback copy failed:', err);
    }
  };

  switch (block.type) {
    case 'objective':
      return (
        <section aria-label="Learning Objectives" className="my-5 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Target Learning Outcomes</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
            {block.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      );

    case 'analogy':
      return (
        <section aria-label="Real-World Analogy" className="my-5 p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-accent uppercase tracking-wider pb-2 border-b border-bg-border">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>{block.title}</span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed italic">
            &ldquo;{block.metaphor}&rdquo;
          </p>
          <div className="p-3 rounded-xl bg-bg-dark border border-brand-primary/30 flex items-start gap-2 text-xs text-text-primary">
            <Sparkles className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <span><strong>Key Takeaway:</strong> {block.takeaway}</span>
          </div>
        </section>
      );

    case 'concept':
      return (
        <article className="my-5 space-y-3">
          {block.title && (
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {block.title}
            </h3>
          )}
          <div className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line space-y-2">
            {block.content}
          </div>
          {block.callout && (
            <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
              block.callout.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : block.callout.type === 'tip'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
            }`}>
              {block.callout.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                {block.callout.text}
              </div>
            </div>
          )}
        </article>
      );

    case 'diagram':
      return <LessonDiagram diagram={block} />;

    case 'command':
      return (
        <div className="my-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-elevated/70 border-b border-bg-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-[11px] font-mono text-text-muted">Git Command</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(block.command)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-dark border border-bg-border text-text-secondary hover:text-white text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={`Copy command: ${block.command}`}
            >
              {copiedCode === block.command ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-bg-dark font-mono text-xs sm:text-sm text-brand-accent overflow-x-auto">
            <code>$ {block.command}</code>
          </div>

          <div className="p-4 space-y-2 border-t border-bg-border/60">
            <p className="text-xs text-text-secondary leading-relaxed">
              {block.explanation}
            </p>
            {block.flags && block.flags.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
                  Command Options & Flags
                </span>
                {block.flags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <code className="px-1.5 py-0.5 rounded bg-bg-dark text-text-primary border border-bg-border font-mono text-[11px]">
                      {flag.flag}
                    </code>
                    <span className="text-text-muted mt-0.5">{flag.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'output':
      return (
        <div className="my-5 rounded-2xl bg-bg-dark border border-bg-border overflow-hidden font-mono text-xs shadow-inner">
          <div className="px-4 py-2 bg-bg-surface/90 border-b border-bg-border flex items-center justify-between text-[11px] text-text-muted">
            <span>Terminal Output Preview</span>
            <span>$ {block.command}</span>
          </div>
          <pre className="p-4 text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
            {block.output}
          </pre>
          {block.note && (
            <div className="px-4 py-2 bg-bg-surface/50 border-t border-bg-border/60 text-[11px] text-text-muted font-sans italic">
              {block.note}
            </div>
          )}
        </div>
      );

    case 'pitfall':
      return (
        <section aria-label="Common Pitfall Warning" className="my-5 p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Common Pitfall & How to Avoid It</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-rose-200">
            Watch out: {block.warning}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Consequence:</strong> {block.consequence}
          </p>
          <div className="p-3 rounded-xl bg-bg-dark border border-rose-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Solution:</strong> {block.solution}</span>
          </div>
        </section>
      );

    case 'summary':
      return (
        <section aria-label="Unit Summary" className="my-5 p-5 rounded-2xl bg-gradient-to-br from-bg-surface to-bg-elevated border border-brand-primary/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-accent" />
            <span>Key Takeaways</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
            {block.points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-brand-accent font-bold">•</span>
                <span className="leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </section>
      );

    default:
      return null;
  }
};
