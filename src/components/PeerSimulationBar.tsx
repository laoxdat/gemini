import React, { useState } from 'react';
import { Share2, ExternalLink, Users, Copy, Check, Sparkles, Info } from 'lucide-react';

interface PeerSimulationBarProps {
  streamUrl: string;
  swarmId?: string;
  virtualSwarmEnabled: boolean;
  onToggleVirtualSwarm: (enabled: boolean) => void;
  realPeerCount: number;
}

export const PeerSimulationBar: React.FC<PeerSimulationBarProps> = ({
  streamUrl,
  swarmId,
  virtualSwarmEnabled,
  onToggleVirtualSwarm,
  realPeerCount,
}) => {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('stream', encodeURIComponent(streamUrl));
    if (swarmId) {
      url.searchParams.set('swarm', swarmId);
    }
    return url.toString();
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPeerTab = () => {
    const shareUrl = getShareUrl();
    // Open in new tab/window
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white">
              Thử nghiệm kết nối P2P đa thiết bị / nhiều Tab
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              {realPeerCount} Peer thực tế
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mở 2 tab trên cùng trình duyệt hoặc gửi link sang thiết bị khác để thấy WebRTC truyền video trực tiếp!
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Virtual Swarm Simulation Toggle */}
        <button
          type="button"
          onClick={() => onToggleVirtualSwarm(!virtualSwarmEnabled)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
            virtualSwarmEnabled
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Tạo giả lập các peer gửi nhận dữ liệu video để kiểm tra giao diện khi chỉ có 1 tab"
        >
          <Sparkles className={`w-3.5 h-3.5 ${virtualSwarmEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{virtualSwarmEnabled ? 'Đang mô phỏng Swarm' : 'Mô phỏng Swarm'}</span>
        </button>

        {/* Copy Swarm Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Sao chép Link Swarm</span>
            </>
          )}
        </button>

        {/* Open Peer Tab */}
        <button
          type="button"
          onClick={handleOpenPeerTab}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Mở Tab Peer Mới</span>
        </button>
      </div>
    </div>
  );
};
