export interface StreamPreset {
  id: string;
  name: string;
  category: 'Vod' | 'Live' | 'Test';
  url: string;
  description: string;
  resolution: string;
}

export interface TrackerConfig {
  id: string;
  url: string;
  enabled: boolean;
  status: 'idle' | 'connected' | 'error';
  pingMs?: number;
}

export interface IceServerConfig {
  id: string;
  urls: string;
  username?: string;
  credential?: string;
  enabled: boolean;
}

export interface P2PEngineSettings {
  isP2PEnabled: boolean;
  isUploadEnabled: boolean;
  highDemandTimeWindow: number; // seconds
  p2pDownloadTimeWindow: number; // seconds
  httpDownloadTimeWindow: number; // seconds
  simultaneousHttpDownloads: number;
  simultaneousP2PDownloads: number;
  swarmId?: string;
}

export const DEFAULT_STREAM_PRESETS: StreamPreset[] = [
  {
    id: 'bbb',
    name: 'Big Buck Bunny (1080p HLS)',
    category: 'Vod',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'High-quality open movie test stream with adaptive multi-bitrate',
    resolution: '1080p / 720p / 480p / 360p',
  },
  {
    id: 'tos',
    name: 'Tears of Steel (Sci-Fi 1080p)',
    category: 'Vod',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    description: 'Blender Foundation open VFX film, fast segment switching',
    resolution: '1080p Multi-audio',
  },
  {
    id: 'sintel',
    name: 'Sintel Animation (720p)',
    category: 'Vod',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    description: 'Classic fantasy animation multi-bitrate HLS stream',
    resolution: '720p / 540p / 360p',
  },
  {
    id: 'apple-bipbop',
    name: 'Apple BipBop Advanced (VOD)',
    category: 'Test',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    description: 'Official Apple test stream with fMP4 segments and timecodes',
    resolution: 'Multi-rate 1080p',
  },
  {
    id: 'akamai-live',
    name: 'Akamai Live Test Stream',
    category: 'Live',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    description: 'Continuous 24/7 live HLS broadcast stream with low latency',
    resolution: '720p Live',
  },
];

export const DEFAULT_TRACKERS: TrackerConfig[] = [
  {
    id: 'openwebtorrent',
    url: 'wss://tracker.openwebtorrent.com',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'webtorrent-dev',
    url: 'wss://tracker.webtorrent.dev',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'files-fm',
    url: 'wss://tracker.files.fm:7073/announce',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'novage',
    url: 'wss://tracker.novage.com.ua',
    enabled: true,
    status: 'idle',
  },
];

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  {
    id: 'google-1',
    urls: 'stun:stun.l.google.com:19302',
    enabled: true,
  },
  {
    id: 'google-2',
    urls: 'stun:stun1.l.google.com:19302',
    enabled: true,
  },
  {
    id: 'google-3',
    urls: 'stun:stun2.l.google.com:19302',
    enabled: true,
  },
  {
    id: 'cloudflare',
    urls: 'stun:stun.cloudflare.com:3478',
    enabled: true,
  },
];

export const DEFAULT_ENGINE_SETTINGS: P2PEngineSettings = {
  isP2PEnabled: true,
  isUploadEnabled: true,
  highDemandTimeWindow: 15,
  p2pDownloadTimeWindow: 45,
  httpDownloadTimeWindow: 20,
  simultaneousHttpDownloads: 3,
  simultaneousP2PDownloads: 4,
  swarmId: 'p2p-demo-channel-1',
};

/**
 * Validates whether a string looks like a valid HLS URL
 */
export function isValidHlsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Check if ends with .m3u8 or has query params or manifest format
    return (
      parsed.pathname.toLowerCase().endsWith('.m3u8') ||
      parsed.pathname.includes('.m3u8') ||
      parsed.search.includes('.m3u8') ||
      parsed.pathname.endsWith('/manifest')
    );
  } catch {
    return false;
  }
}

/**
 * Validates a WebSocket tracker URL
 */
export function isValidTrackerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'wss:' || parsed.protocol === 'ws:';
  } catch {
    return false;
  }
}

/**
 * Validates a STUN or TURN server URL
 */
export function isValidIceServerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('stun:') ||
    trimmed.startsWith('stuns:') ||
    trimmed.startsWith('turn:') ||
    trimmed.startsWith('turns:')
  );
}

/**
 * Generate a friendly hash or swarm ID from a URL
 */
export function generateSwarmId(streamUrl: string, customId?: string): string {
  if (customId && customId.trim().length > 0) {
    return customId.trim();
  }
  let hash = 0;
  for (let i = 0; i < streamUrl.length; i++) {
    const char = streamUrl.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `p2p-swarm-${Math.abs(hash).toString(36)}`;
}
