import React, { useEffect, useRef } from 'react';
import { Terminal, X, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export function ConsoleTerminal() {
  const { logs, isConsoleOpen, setIsConsoleOpen } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isConsoleOpen]);

  if (!isConsoleOpen) return null;

  return (
    <div className="flex-1 h-full w-full bg-[#0d0d12] flex flex-col font-mono overflow-hidden">

      <div className="flex items-center justify-between px-4 py-2 bg-[#161622] border-b border-[#2a2a3e] shrink-0">
        <div className="flex items-center gap-2 text-muted">
          <Terminal className="w-4 h-4 text-accent" />
          <span className="text-xs uppercase tracking-widest font-semibold text-text/80">System Console</span>
        </div>
        <button
          onClick={() => setIsConsoleOpen(false)}
          className="text-muted hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 text-[11px] leading-relaxed hidden-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-muted">
            <Code2 className="w-8 h-8 mb-2" />
            <p>Waiting for system events...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {logs.map((log, i) => {
              let colorClass = "text-gray-300";
              if (log.includes("ERROR") || log.includes("failed")) colorClass = "text-red-400";
              else if (log.includes("SUCCESS") || log.includes("✅")) colorClass = "text-green-400";
              else if (log.includes("WARN") || log.includes("⚠️")) colorClass = "text-yellow-400";
              else if (log.includes("POST") || log.includes("GET")) colorClass = "text-blue-400";

              return (
                <div key={i} className="flex break-words">
                  <span className="text-[#00ff88]/50 mr-2 shrink-0">~❯</span>
                  <span className={colorClass}>{log}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
