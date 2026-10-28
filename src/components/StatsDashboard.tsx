import React from 'react';
import { P2PStats } from '../types/p2p';
import {
  formatBytes,
  formatBitrate,
  calculateP2PRatio,
  calculateBandwidthSavings,
} from '../utils/formatters';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CloudLightning,
  Percent,
  DollarSign,
  Gauge,
  Wifi,
} from 'lucide-react';

interface StatsDashboardProps {
  stats: P2PStats;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  const p2pRatio = calculateP2PRatio(stats.p2pDownloadedBytes, stats.httpDownloadedBytes);
  const totalDownloaded = stats.p2pDownloadedBytes + stats.httpDownloadedBytes;
  const savings = calculateBandwidthSavings(stats.p2pDownloadedBytes);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Metric 1: P2P Ratio */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
          <span className="font-medium">Tỷ lệ P2P chia sẻ</span>
          <Percent className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-400">
            {p2pRatio}%
          </span>
          <span className="text-xs text-slate-400">giảm tải CDN</span>
        </div>
        {/* Progress meter */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${p2pRatio}%` }}
          />
          <div
            className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${100 - p2pRatio}%` }}
          />
        </div>
      </div>

      {/* Metric 2: P2P Downloaded vs CDN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm group hover:border-sky-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
          <span className="font-medium">Tổng tải về (Total DL)</span>
          <ArrowDownCircle className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {formatBytes(totalDownloaded)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span className="text-emerald-400">P2P: {formatBytes(stats.p2pDownloadedBytes)}</span>
          <span className="text-sky-400">CDN: {formatBytes(stats.httpDownloadedBytes)}</span>
        </div>
      </div>

      {/* Metric 3: P2P Uploaded */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm group hover:border-indigo-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
          <span className="font-medium">Tải lên Swarm (Upload)</span>
          <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-xl font-bold text-indigo-300 tracking-tight">
          {formatBytes(stats.p2pUploadedBytes)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <Wifi className="w-3 h-3 text-indigo-400" />
          <span>Đóng góp cho các peer</span>
        </div>
      </div>

      {/* Metric 4: CDN Cost Savings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm group hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
          <span className="font-medium">Tiết kiệm băng thông CDN</span>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold text-amber-300 tracking-tight">
          ~${savings.estimatedSavingsUsd.toFixed(4)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <CloudLightning className="w-3 h-3 text-amber-400" />
          <span>{savings.savedGb} GB dung lượng mạng</span>
        </div>
      </div>

      {/* Speed Metrics row */}
      <div className="col-span-2 md:col-span-4 bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Tốc độ mạng trực tiếp:</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">P2P Tải về:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBitrate(stats.p2pDownloadSpeedBps)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-400">HTTP Tải về:</span>
            <span className="font-mono font-bold text-sky-400">
              {formatBitrate(stats.httpSpeedBps)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-400">P2P Tải lên:</span>
            <span className="font-mono font-bold text-indigo-400">
              {formatBitrate(stats.p2pUploadSpeedBps)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
