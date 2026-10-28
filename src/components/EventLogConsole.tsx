import React, { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types/p2p';
import { Terminal, Trash2, Copy, Check, Filter } from 'lucide-react';

interface EventLogConsoleProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const EventLogConsole: React.FC<EventLogConsoleProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'p2p' | 'http' | 'peer' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'p2p') return log.type === 'p2p';
    if (filter === 'http') return log.type === 'http';
    if (filter === 'peer') return log.type === 'peer';
    if (filter === 'error') return log.type === 'error' || log.type === 'warning';
    return true;
  });

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopy = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-[320px]">
      {/* Console Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Nhật ký sự kiện P2P & HLS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {filteredLogs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('p2p')}
              className={`px-2 py-0.5 rounded ${
                filter === 'p2p'
                  ? 'bg-emerald-950 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              P2P
            </button>
            <button
              onClick={() => setFilter('http')}
              className={`px-2 py-0.5 rounded ${
                filter === 'http'
                  ? 'bg-sky-950 text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-sky-400'
              }`}
            >
              CDN
            </button>
            <button
              onClick={() => setFilter('peer')}
              className={`px-2 py-0.5 rounded ${
                filter === 'peer'
                  ? 'bg-indigo-950 text-indigo-300 font-medium'
                  : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              Peers
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded ${
                filter === 'error'
                  ? 'bg-rose-950 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Lỗi
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleCopy}
            title="Sao chép nhật ký"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClearLogs}
            title="Xoá nhật ký"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] pr-1 scrollbar-thin select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-8">
            Chưa có sự kiện nào. Hãy phát video để theo dõi luồng dữ liệu...
          </div>
        ) : (
          filteredLogs.map((log) => {
            let badgeBg = 'bg-slate-800 text-slate-400';
            if (log.type === 'p2p') badgeBg = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50';
            if (log.type === 'http') badgeBg = 'bg-sky-950/80 text-sky-300 border border-sky-800/50';
            if (log.type === 'peer') badgeBg = 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50';
            if (log.type === 'tracker') badgeBg = 'bg-amber-950/80 text-amber-300 border border-amber-800/50';
            if (log.type === 'error') badgeBg = 'bg-rose-950/80 text-rose-300 border border-rose-800/50';
            if (log.type === 'warning') badgeBg = 'bg-yellow-950/80 text-yellow-300 border border-yellow-800/50';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2 py-0.5 hover:bg-slate-900/50 rounded px-1"
              >
                <span className="text-slate-500 shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`px-1 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 ${badgeBg}`}
                >
                  {log.type}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer controls */}
      <div className="pt-2 mt-1 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 w-3 h-3"
          />
          <span>Tự động cuộn</span>
        </label>
        <span>P2P Media Loader v4.0.0 & Hls.js</span>
      </div>
    </div>
  );
};
