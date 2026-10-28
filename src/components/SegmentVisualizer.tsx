import React, { useState } from 'react';
import { SegmentInfo } from '../types/p2p';
import { formatBytes } from '../utils/formatters';
import { Layers, Network, Server, Clock } from 'lucide-react';

interface SegmentVisualizerProps {
  segments: SegmentInfo[];
  currentTime: number;
  duration: number;
}

export const SegmentVisualizer: React.FC<SegmentVisualizerProps> = ({
  segments,
  currentTime,
  duration,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<SegmentInfo | null>(null);

  const p2pCount = segments.filter((s) => s.source === 'p2p').length;
  const httpCount = segments.filter((s) => s.source === 'http').length;
  const totalCount = segments.length;
  const p2pPercent = totalCount > 0 ? Math.round((p2pCount / totalCount) * 100) : 0;

  // Keep latest 40 segments or full timeline
  const displaySegments = segments.slice(-48);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Bản đồ phân đoạn Video (Segment Chunks Map)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {totalCount} chunks
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 font-medium">P2P Peers ({p2pPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 shadow-sm shadow-sky-500/50" />
            <span className="text-slate-300 font-medium">HTTP CDN ({100 - p2pPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 animate-pulse" />
            <span className="text-slate-400">Đang tải</span>
          </div>
        </div>
      </div>

      {/* Segment Blocks */}
      <div className="relative">
        <div className="h-9 w-full bg-slate-950/80 rounded-lg p-1.5 flex items-center gap-1 border border-slate-800/80 overflow-x-auto scrollbar-thin">
          {displaySegments.length === 0 ? (
            <div className="w-full text-center text-xs text-slate-500 py-1">
              Chưa có phân đoạn nào được tải. Hãy bấm phát video để bắt đầu truyền nhận P2P...
            </div>
          ) : (
            displaySegments.map((seg, idx) => {
              const isP2P = seg.source === 'p2p';
              const isLatest = idx === displaySegments.length - 1;
              return (
                <div
                  key={seg.id || `${seg.sn}-${idx}`}
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`h-full flex-1 min-w-[12px] max-w-[28px] rounded-xs cursor-pointer transition-all duration-150 hover:scale-110 hover:z-10 relative ${
                    isP2P
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-xs shadow-emerald-500/30'
                      : 'bg-sky-500 hover:bg-sky-400 shadow-xs shadow-sky-500/30'
                  } ${isLatest ? 'ring-1 ring-white/60 animate-pulse' : ''}`}
                  title={`Segment #${seg.sn}: ${seg.source.toUpperCase()} (${formatBytes(seg.bytes)})`}
                />
              );
            })
          )}
        </div>

        {/* Hovered Tooltip info bar */}
        {hoveredSegment && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs flex flex-wrap items-center gap-4 text-slate-300 animate-fadeIn">
            <span className="font-semibold text-white">Phân đoạn #{hoveredSegment.sn}</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              {hoveredSegment.duration.toFixed(1)}s thời lượng
            </span>
            <span className="font-mono text-slate-200">
              Kích thước: {formatBytes(hoveredSegment.bytes)}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                hoveredSegment.source === 'p2p'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {hoveredSegment.source === 'p2p' ? (
                <>
                  <Network className="w-3 h-3" />
                  Nguồn: Peer WebRTC {hoveredSegment.peerId ? `(${hoveredSegment.peerId.slice(0, 8)})` : ''}
                </>
              ) : (
                <>
                  <Server className="w-3 h-3" />
                  Nguồn: Máy chủ CDN HTTP
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
