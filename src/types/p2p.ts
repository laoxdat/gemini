export type DownloadSource = 'http' | 'p2p';

export interface SegmentInfo {
  id: string;
  url: string;
  sn: number; // sequence number
  source: DownloadSource;
  bytes: number;
  duration: number; // in seconds
  timestamp: number;
  peerId?: string;
}

export interface PeerInfo {
  id: string;
  connectedAt: number;
  bytesReceived: number;
  bytesSent: number;
  status: 'connected' | 'connecting' | 'disconnected';
  latencyMs?: number;
}

export interface P2PStats {
  httpDownloadedBytes: number;
  p2pDownloadedBytes: number;
  p2pUploadedBytes: number;
  httpSpeedBps: number;
  p2pDownloadSpeedBps: number;
  p2pUploadSpeedBps: number;
  activePeersCount: number;
  totalSegmentsLoaded: number;
  p2pSegmentsLoaded: number;
  httpSegmentsLoaded: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'p2p' | 'http' | 'peer' | 'tracker' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown> | string;
}
