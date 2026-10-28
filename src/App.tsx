/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_STREAM_PRESETS,
  DEFAULT_TRACKERS,
  DEFAULT_ICE_SERVERS,
  DEFAULT_ENGINE_SETTINGS,
  TrackerConfig,
  IceServerConfig,
  P2PEngineSettings,
} from './utils/config';
import {
  SegmentInfo,
  PeerInfo,
  P2PStats,
  LogEntry,
  DownloadSource,
} from './types/p2p';
import { VideoPlayer } from './components/VideoPlayer';
import { StatsDashboard } from './components/StatsDashboard';
import { SegmentVisualizer } from './components/SegmentVisualizer';
import { SwarmVisualizer } from './components/SwarmVisualizer';
import { StreamConfigPanel } from './components/StreamConfigPanel';
import { TrackerManager } from './components/TrackerManager';
import { StunManager } from './components/StunManager';
import { EventLogConsole } from './components/EventLogConsole';
import { PeerSimulationBar } from './components/PeerSimulationBar';
import { calculateP2PRatio } from './utils/formatters';
import {
  Radio,
  Tv,
  Globe,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Info,
  X,
  Share2,
} from 'lucide-react';

export default function App() {
  // Parse query params if provided (for multi-tab testing)
  const queryParams = new URLSearchParams(window.location.search);
  const initialStream = queryParams.get('stream')
    ? decodeURIComponent(queryParams.get('stream')!)
    : DEFAULT_STREAM_PRESETS[0].url;
  const initialSwarm = queryParams.get('swarm') || DEFAULT_ENGINE_SETTINGS.swarmId;

  // State
  const [streamUrl, setStreamUrl] = useState<string>(initialStream);
  const [trackers, setTrackers] = useState<TrackerConfig[]>(DEFAULT_TRACKERS);
  const [iceServers, setIceServers] = useState<IceServerConfig[]>(DEFAULT_ICE_SERVERS);
  const [engineSettings, setEngineSettings] = useState<P2PEngineSettings>({
    ...DEFAULT_ENGINE_SETTINGS,
    swarmId: initialSwarm,
  });

  const [activeTab, setActiveTab] = useState<'stream' | 'trackers' | 'stun' | 'logs'>('stream');
  const [showArchModal, setShowArchModal] = useState(false);
  const [virtualSwarmEnabled, setVirtualSwarmEnabled] = useState(false);

  // Telemetry & Stats State
  const [stats, setStats] = useState<P2PStats>({
    httpDownloadedBytes: 0,
    p2pDownloadedBytes: 0,
    p2pUploadedBytes: 0,
    httpSpeedBps: 0,
    p2pDownloadSpeedBps: 0,
    p2pUploadSpeedBps: 0,
    activePeersCount: 0,
    totalSegmentsLoaded: 0,
    p2pSegmentsLoaded: 0,
    httpSegmentsLoaded: 0,
  });

  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: Date.now(),
      type: 'info',
      message: 'Khởi chạy ứng dụng P2P Media Loader Demo (HLS + WebRTC).',
    },
  ]);

  // Activity flags for visualizer animations
  const [isHttpActive, setIsHttpActive] = useState(false);
  const [isP2PActive, setIsP2PActive] = useState(false);

  // Speed calculation buffer refs
  const bytesSinceLastTickRef = useRef({
    http: 0,
    p2pDown: 0,
    p2pUp: 0,
  });

  // Calculate transfer speeds every 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      const httpBps = bytesSinceLastTickRef.current.http * 8;
      const p2pDownBps = bytesSinceLastTickRef.current.p2pDown * 8;
      const p2pUpBps = bytesSinceLastTickRef.current.p2pUp * 8;

      bytesSinceLastTickRef.current = { http: 0, p2pDown: 0, p2pUp: 0 };

      setStats((prev) => ({
        ...prev,
        httpSpeedBps: httpBps,
        p2pDownloadSpeedBps: p2pDownBps,
        p2pUploadSpeedBps: p2pUpBps,
        activePeersCount: peers.length,
      }));

      setIsHttpActive(httpBps > 0);
      setIsP2PActive(p2pDownBps > 0 || p2pUpBps > 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [peers.length]);

  // Virtual Peer Swarm simulation effect
  useEffect(() => {
    if (!virtualSwarmEnabled) {
      // Remove simulated peers when disabled
      setPeers((prev) => prev.filter((p) => !p.id.startsWith('sim-')));
      return;
    }

    // Seed 3 simulated peers
    const simPeers: PeerInfo[] = [
      {
        id: 'sim-peer-alpha-8a',
        connectedAt: Date.now() - 30000,
        bytesReceived: 1024 * 1024 * 2.4,
        bytesSent: 1024 * 1024 * 1.8,
        status: 'connected',
        latencyMs: 24,
      },
      {
        id: 'sim-peer-bravo-3c',
        connectedAt: Date.now() - 20000,
        bytesReceived: 1024 * 1024 * 3.1,
        bytesSent: 1024 * 512,
        status: 'connected',
        latencyMs: 42,
      },
      {
        id: 'sim-peer-delta-9f',
        connectedAt: Date.now() - 10000,
        bytesReceived: 1024 * 1024 * 1.5,
        bytesSent: 1024 * 1024 * 2.2,
        status: 'connected',
        latencyMs: 18,
      },
    ];

    setPeers((prev) => [...prev.filter((p) => !p.id.startsWith('sim-')), ...simPeers]);

    addLog({
      type: 'peer',
      message: 'Mô phỏng Swarm kích hoạt: 3 Virtual Peers đã tham gia Swarm.',
    });

    const interval = setInterval(() => {
      // Periodically simulate chunk sharing
      const bytes = 180000 + Math.floor(Math.random() * 240000);
      const isUpload = Math.random() > 0.4;

      if (isUpload) {
        bytesSinceLastTickRef.current.p2pUp += bytes;
        setStats((prev) => ({
          ...prev,
          p2pUploadedBytes: prev.p2pUploadedBytes + bytes,
        }));
      } else {
        bytesSinceLastTickRef.current.p2pDown += bytes;
        setStats((prev) => ({
          ...prev,
          p2pDownloadedBytes: prev.p2pDownloadedBytes + bytes,
          p2pSegmentsLoaded: prev.p2pSegmentsLoaded + 1,
          totalSegmentsLoaded: prev.totalSegmentsLoaded + 1,
        }));
      }

      setPeers((prev) =>
        prev.map((p) => {
          if (!p.id.startsWith('sim-')) return p;
          return {
            ...p,
            bytesReceived: p.bytesReceived + (isUpload ? 0 : bytes / 3),
            bytesSent: p.bytesSent + (isUpload ? bytes / 3 : 0),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [virtualSwarmEnabled]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev.slice(-199),
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        ...entry,
      },
    ]);
  }, []);

  const handleSegmentLoaded = useCallback((seg: SegmentInfo) => {
    setSegments((prev) => [...prev.slice(-99), seg]);
    setStats((prev) => {
      const isP2P = seg.source === 'p2p';
      return {
        ...prev,
        totalSegmentsLoaded: prev.totalSegmentsLoaded + 1,
        p2pSegmentsLoaded: prev.p2pSegmentsLoaded + (isP2P ? 1 : 0),
        httpSegmentsLoaded: prev.httpSegmentsLoaded + (isP2P ? 0 : 1),
      };
    });
  }, []);

  const handleChunkDownloaded = useCallback(
    (bytes: number, source: DownloadSource, peerId?: string) => {
      if (source === 'p2p') {
        bytesSinceLastTickRef.current.p2pDown += bytes;
        setStats((prev) => ({
          ...prev,
          p2pDownloadedBytes: prev.p2pDownloadedBytes + bytes,
        }));
        if (peerId) {
          setPeers((prev) =>
            prev.map((p) =>
              p.id === peerId ? { ...p, bytesReceived: p.bytesReceived + bytes } : p
            )
          );
        }
      } else {
        bytesSinceLastTickRef.current.http += bytes;
        setStats((prev) => ({
          ...prev,
          httpDownloadedBytes: prev.httpDownloadedBytes + bytes,
        }));
      }
    },
    []
  );

  const handleChunkUploaded = useCallback((bytes: number, peerId: string) => {
    bytesSinceLastTickRef.current.p2pUp += bytes;
    setStats((prev) => ({
      ...prev,
      p2pUploadedBytes: prev.p2pUploadedBytes + bytes,
    }));
    setPeers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, bytesSent: p.bytesSent + bytes } : p))
    );
  }, []);

  const handlePeerConnect = useCallback((peerId: string) => {
    setPeers((prev) => {
      if (prev.some((p) => p.id === peerId)) return prev;
      return [
        ...prev,
        {
          id: peerId,
          connectedAt: Date.now(),
          bytesReceived: 0,
          bytesSent: 0,
          status: 'connected',
          latencyMs: Math.floor(15 + Math.random() * 35),
        },
      ];
    });
  }, []);

  const handlePeerClose = useCallback((peerId: string) => {
    setPeers((prev) => prev.filter((p) => p.id !== peerId));
  }, []);

  const handleApplyReload = () => {
    // Force player remount by re-setting stream URL
    const curr = streamUrl;
    setStreamUrl('');
    setTimeout(() => {
      setStreamUrl(curr);
      addLog({
        type: 'info',
        message: 'Áp dụng cấu hình và nạp lại luồng video thành công!',
      });
    }, 50);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const p2pRatio = calculateP2PRatio(stats.p2pDownloadedBytes, stats.httpDownloadedBytes);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-sky-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">
                  P2P Media Loader Studio
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  WebRTC + HLS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phát video stream mượt mà & chia sẻ băng thông ngang hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Status Badges */}
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">P2P Ratio:</span>
              <span className="font-bold text-emerald-400">{p2pRatio}%</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Peers:</span>
              <span className="font-bold text-indigo-400">{peers.length}</span>
            </div>

            {/* Architecture Info Modal trigger */}
            <button
              onClick={() => setShowArchModal(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Xem kiến trúc hoạt động P2P"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Multi-tab / Multi-peer helper bar */}
        <PeerSimulationBar
          streamUrl={streamUrl}
          swarmId={engineSettings.swarmId}
          virtualSwarmEnabled={virtualSwarmEnabled}
          onToggleVirtualSwarm={setVirtualSwarmEnabled}
          realPeerCount={peers.filter((p) => !p.id.startsWith('sim-')).length}
        />

        {/* Real-time stats metric cards */}
        <StatsDashboard stats={stats} />

        {/* Core Layout: Video + Visualizers on Left, Config Panel on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player, Segment Map, Swarm Topology */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Video Player */}
            {streamUrl ? (
              <VideoPlayer
                streamUrl={streamUrl}
                trackers={trackers}
                iceServers={iceServers}
                engineSettings={engineSettings}
                onSegmentLoaded={handleSegmentLoaded}
                onChunkDownloaded={handleChunkDownloaded}
                onChunkUploaded={handleChunkUploaded}
                onPeerConnect={handlePeerConnect}
                onPeerClose={handlePeerClose}
                onLog={addLog}
                isP2PActive={engineSettings.isP2PEnabled}
                p2pRatio={p2pRatio}
                peerCount={peers.length}
              />
            ) : (
              <div className="aspect-video w-full bg-slate-900/50 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-500 text-xs">
                Vui lòng chọn hoặc nhập luồng video HLS để phát
              </div>
            )}

            {/* Segment Map Visualizer */}
            <SegmentVisualizer
              segments={segments}
              currentTime={0}
              duration={100}
            />

            {/* Swarm Topology Visualizer */}
            <SwarmVisualizer
              peers={peers}
              httpActive={isHttpActive}
              p2pActive={isP2PActive}
              httpBytes={stats.httpDownloadedBytes}
              p2pBytes={stats.p2pDownloadedBytes}
              swarmId={engineSettings.swarmId}
            />
          </div>

          {/* Right Column: Tabbed Configuration Panels */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur flex flex-col">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('stream')}
                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'stream'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Luồng HLS</span>
              </button>

              <button
                onClick={() => setActiveTab('trackers')}
                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'trackers'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Trackers</span>
              </button>

              <button
                onClick={() => setActiveTab('stun')}
                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'stun'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>STUN/TURN</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'logs'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Nhật ký</span>
              </button>
            </div>

            {/* Active Tab Panel */}
            <div className="flex-1">
              {activeTab === 'stream' && (
                <StreamConfigPanel
                  currentUrl={streamUrl}
                  onSelectStream={(url) => setStreamUrl(url)}
                  engineSettings={engineSettings}
                  onUpdateEngineSettings={setEngineSettings}
                  onApplyReload={handleApplyReload}
                />
              )}

              {activeTab === 'trackers' && (
                <TrackerManager
                  trackers={trackers}
                  onUpdateTrackers={setTrackers}
                  onApplyReload={handleApplyReload}
                />
              )}

              {activeTab === 'stun' && (
                <StunManager
                  iceServers={iceServers}
                  onUpdateIceServers={setIceServers}
                  onApplyReload={handleApplyReload}
                />
              )}

              {activeTab === 'logs' && (
                <EventLogConsole logs={logs} onClearLogs={handleClearLogs} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Architecture Explainer Modal */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Kiến trúc P2P Media Loader (WebRTC + HLS)
                </h3>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>P2P Media Loader</strong> là công nghệ eCDN mã nguồn mở cho phép phát video trực tuyến mượt mà mà không cần cài đặt plugin hay server chuyên dụng, dựa hoàn toàn trên các chuẩn web hiện đại:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>
                  <strong className="text-sky-400">HLS (HTTP Live Streaming)</strong>: Luồng video được chia nhỏ thành các phân đoạn <code>.ts</code> hoặc <code>.m4s</code> (fMP4) và danh sách phát <code>.m3u8</code>.
                </li>
                <li>
                  <strong className="text-emerald-400">WebTorrent Trackers</strong>: Điều phối báo hiệu (signaling) qua WebSocket để các trình duyệt cùng xem 1 luồng video tìm thấy nhau và tạo thành một mạng Swarm.
                </li>
                <li>
                  <strong className="text-indigo-400">STUN / TURN ICE Servers</strong>: Giúp các client vượt qua tường lửa NAT của router/4G để thiết lập kênh dữ liệu <code>RTCDataChannel</code> trực tiếp.
                </li>
                <li>
                  <strong className="text-amber-400">Cơ chế Hybrid Fallback</strong>: Các phân đoạn chuẩn bị phát ngay lập tức (High Demand Window) sẽ tải từ CDN qua HTTP để bảo đảm không giật lag. Các phân đoạn trong tương lai được tải chia sẻ ngang hàng từ các peer qua WebRTC, giảm tới 70-90% chi phí băng thông máy chủ!
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
