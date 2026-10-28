import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { HlsJsP2PEngine } from 'p2p-media-loader-hlsjs';
import {
  TrackerConfig,
  IceServerConfig,
  P2PEngineSettings,
} from '../utils/config';
import {
  SegmentInfo,
  PeerInfo,
  LogEntry,
  DownloadSource,
} from '../types/p2p';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  Tv,
  Radio,
  Wifi,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface VideoPlayerProps {
  streamUrl: string;
  trackers: TrackerConfig[];
  iceServers: IceServerConfig[];
  engineSettings: P2PEngineSettings;
  onSegmentLoaded: (segment: SegmentInfo) => void;
  onChunkDownloaded: (bytes: number, source: DownloadSource, peerId?: string) => void;
  onChunkUploaded: (bytes: number, peerId: string) => void;
  onPeerConnect: (peerId: string) => void;
  onPeerClose: (peerId: string) => void;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  isP2PActive: boolean;
  p2pRatio: number;
  peerCount: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  trackers,
  iceServers,
  engineSettings,
  onSegmentLoaded,
  onChunkDownloaded,
  onChunkUploaded,
  onPeerConnect,
  onPeerClose,
  onLog,
  isP2PActive,
  p2pRatio,
  peerCount,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const engineRef = useRef<HlsJsP2PEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is auto
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Initialize HLS & P2P Engine
  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setErrorMessage(null);
    setIsBuffering(true);

    // Destroy existing instances
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying hls:', e);
      }
      hlsRef.current = null;
    }

    if (engineRef.current) {
      try {
        engineRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying engine:', e);
      }
      engineRef.current = null;
    }

    const enabledTrackers = trackers.filter((t) => t.enabled).map((t) => t.url);
    const enabledIceServers = iceServers
      .filter((s) => s.enabled)
      .map((s) => ({
        urls: s.urls,
        ...(s.username ? { username: s.username } : {}),
        ...(s.credential ? { credential: s.credential } : {}),
      }));

    onLog({
      type: 'info',
      message: `Khởi tạo P2P Engine với ${enabledTrackers.length} trackers, Swarm ID: ${
        engineSettings.swarmId || 'auto'
      }`,
    });

    try {
      // 1. Create HlsJsP2PEngine
      const engine = new HlsJsP2PEngine({
        core: {
          announceTrackers: enabledTrackers,
          rtcConfig: {
            iceServers: enabledIceServers,
          },
          isP2PDisabled: !engineSettings.isP2PEnabled,
          isP2PUploadDisabled: !engineSettings.isUploadEnabled,
          highDemandTimeWindow: engineSettings.highDemandTimeWindow,
          p2pDownloadTimeWindow: engineSettings.p2pDownloadTimeWindow,
          httpDownloadTimeWindow: engineSettings.httpDownloadTimeWindow,
          simultaneousHttpDownloads: engineSettings.simultaneousHttpDownloads,
          simultaneousP2PDownloads: engineSettings.simultaneousP2PDownloads,
          swarmId: engineSettings.swarmId || undefined,
        },
      });

      engineRef.current = engine;

      // Event listeners on P2P Engine
      engine.addEventListener('onChunkDownloaded', (bytes, downloadSource, peerId) => {
        onChunkDownloaded(bytes, downloadSource as DownloadSource, peerId);
      });

      engine.addEventListener('onChunkUploaded', (bytes, peerId) => {
        onChunkUploaded(bytes, peerId);
      });

      engine.addEventListener('onSegmentLoaded', (params: any) => {
        const seg = params?.segment;
        const source = (params?.downloadSource || 'http') as DownloadSource;
        const bytes = params?.bytesLength || (seg?.byteLength ?? 250000);
        const durationSec = seg?.duration || 4.0;
        const sn = seg?.sequence ?? Math.floor(Math.random() * 100);

        onSegmentLoaded({
          id: `${sn}-${Date.now()}`,
          url: seg?.url || streamUrl,
          sn: sn,
          source: source,
          bytes: bytes,
          duration: durationSec,
          timestamp: Date.now(),
          peerId: params?.peerId,
        });

        onLog({
          type: source === 'p2p' ? 'p2p' : 'http',
          message: `Phân đoạn #${sn} (${(bytes / 1024).toFixed(1)} KB) đã tải xong từ ${
            source === 'p2p' ? `Peer ${params?.peerId?.slice(0, 8) || ''}` : 'CDN HTTP'
          }`,
        });
      });

      engine.addEventListener('onPeerConnect', (params: any) => {
        const peerId = params?.peerId || `peer-${Date.now().toString(36)}`;
        onPeerConnect(peerId);
        onLog({
          type: 'peer',
          message: `Đã kết nối WebRTC với Peer mới: ${peerId.slice(0, 10)}...`,
        });
      });

      engine.addEventListener('onPeerClose', (params: any) => {
        const peerId = params?.peerId || '';
        onPeerClose(peerId);
        onLog({
          type: 'peer',
          message: `Peer ${peerId.slice(0, 10)}... đã ngắt kết nối`,
        });
      });

      engine.addEventListener('onTrackerError', (params: any) => {
        onLog({
          type: 'tracker',
          message: `Lỗi kết nối Tracker: ${params?.trackerUrl || 'Unknown'} - ${
            params?.error?.message || 'Connection failed'
          }`,
        });
      });

      engine.addEventListener('onTrackerWarning', (params: any) => {
        onLog({
          type: 'warning',
          message: `Cảnh báo Tracker: ${params?.trackerUrl || ''} - ${params?.warning?.message || ''}`,
        });
      });

      // 2. Check HLS.js support
      if (Hls.isSupported()) {
        const hls = new Hls({
          ...engine.getConfigForHlsJs(),
          liveSyncDurationCount: 3,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxBufferLength: 30,
        });

        hlsRef.current = hls;
        engine.bindHls(hls);

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsBuffering(false);
          const parsedLevels = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height,
            bitrate: lvl.bitrate,
          }));
          setLevels(parsedLevels);
          onLog({
            type: 'info',
            message: `Manifest phân tích thành công: ${data.levels.length} chất lượng độ phân giải khả dụng`,
          });
          // Attempt autoplay muted if desired
          video.play().catch(() => {
            // Autoplay with sound might require user gesture, keep paused
            setIsPlaying(false);
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          onLog({
            type: 'info',
            message: `Đổi độ phân giải sang Level ${data.level} (${levels[data.level]?.height || ''}p)`,
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            onLog({
              type: 'error',
              message: `Lỗi nghiêm trọng HLS (${data.type}): ${data.details}`,
            });
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setErrorMessage(`Lỗi phát luồng: ${data.details}. Vui lòng thử kiểm tra URL.`);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari fallback
        video.src = streamUrl;
      } else {
        setErrorMessage('Trình duyệt không hỗ trợ HLS hoặc WebRTC MSE');
      }
    } catch (err: any) {
      console.error('Failed to init P2P player:', err);
      setErrorMessage(`Lỗi khởi tạo P2P Engine: ${err.message}`);
    }
  }, [streamUrl, trackers, iceServers, engineSettings]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {}
      }
      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch {}
      }
    };
  }, [initPlayer]);

  // Video Element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => {
      const dur = video.duration;
      if (dur === Infinity || isNaN(dur)) {
        setIsLive(true);
        setDuration(0);
      } else {
        setIsLive(false);
        setDuration(dur);
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || isLive) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Number(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const handleSelectLevel = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setShowSettings(false);
    }
  };

  const handleSelectSpeed = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSettings(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <span className="text-xs font-medium text-slate-200">Đang đồng bộ P2P & HLS...</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 z-30">
          <div className="max-w-md text-center flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
            <h4 className="text-sm font-bold text-white">Không thể phát luồng</h4>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <button
              onClick={initPlayer}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Top HUD: P2P Badge & Stream info */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* P2P Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg border transition-all ${
              isP2PActive
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isP2PActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isP2PActive ? `P2P Mesh: ${p2pRatio}%` : 'P2P Tắt'}</span>
          </div>

          {/* Connected Peers Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-700 text-slate-200 backdrop-blur-md">
            <Wifi className="w-3.5 h-3.5 text-indigo-400" />
            <span>{peerCount} Peers</span>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600/90 text-white shadow-lg animate-pulse pointer-events-auto">
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar (Fades in on hover or when paused) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
          isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
      >
        {/* Timeline Progress Bar (VoD only) */}
        {!isLive && duration > 0 && (
          <div className="relative w-full mb-2 flex items-center group/timeline">
            {/* Buffer bar background */}
            <div className="absolute left-0 right-0 h-1.5 bg-slate-700/80 rounded-full overflow-hidden pointer-events-none">
              <div
                className="h-full bg-slate-500/70"
                style={{ width: `${Math.min(100, (bufferedEnd / duration) * 100)}%` }}
              />
            </div>
            {/* Seek Input */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Tua thời gian video"
              className="w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-emerald-400 z-10"
            />
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title={isPlaying ? 'Tạm dừng (K)' : 'Phát (K)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={isMuted ? 'Bật âm' : 'Tắt âm'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Âm lượng video"
                className="w-16 h-1 accent-emerald-400 cursor-pointer hidden group-hover/volume:block"
              />
            </div>

            {/* Time display */}
            <div className="font-mono text-slate-300 text-[11px]">
              {isLive ? (
                <span className="text-rose-400 font-semibold">Trực tiếp</span>
              ) : (
                <>
                  <span>{formatDuration(currentTime)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span>{formatDuration(duration)}</span>
                </>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Settings button (Quality & Speed) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="Cài đặt chất lượng & tốc độ"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-2.5 z-30 animate-fadeIn">
                  {/* Quality selector */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Chất lượng HLS
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSelectLevel(-1)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                          currentLevel === -1
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>Tự động (Auto ABR)</span>
                        {currentLevel === -1 && <Sparkles className="w-3 h-3" />}
                      </button>
                      {levels.map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => handleSelectLevel(lvl.id)}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                            currentLevel === lvl.id
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{lvl.height}p</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(lvl.bitrate / 1000000).toFixed(1)} Mbps
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed selector */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Tốc độ phát
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleSelectSpeed(spd)}
                          className={`py-1 rounded text-[10px] font-medium text-center ${
                            playbackRate === spd
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reload stream button */}
            <button
              onClick={initPlayer}
              className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Tải lại luồng"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
