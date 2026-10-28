/**
 * Format bytes into human readable format (KB, MB, GB, etc.)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format bits per second to human readable format (Kbps, Mbps)
 */
export function formatBitrate(bps: number, decimals = 1): string {
  if (bps <= 0 || isNaN(bps)) return '0 Kbps';
  if (bps >= 1_000_000) {
    return `${parseFloat((bps / 1_000_000).toFixed(decimals))} Mbps`;
  }
  return `${parseFloat((bps / 1_000).toFixed(decimals))} Kbps`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Calculate the percentage of data loaded through P2P vs Total (HTTP + P2P)
 */
export function calculateP2PRatio(p2pBytes: number, httpBytes: number): number {
  const total = p2pBytes + httpBytes;
  if (total <= 0) return 0;
  const ratio = (p2pBytes / total) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio * 10) / 10));
}

/**
 * Calculate CDN bandwidth cost savings
 * default CDN cost: $0.08 per GB
 */
export function calculateBandwidthSavings(
  p2pBytes: number,
  costPerGb = 0.08
): { savedGb: number; estimatedSavingsUsd: number } {
  if (p2pBytes <= 0) {
    return { savedGb: 0, estimatedSavingsUsd: 0 };
  }
  const bytesInGb = 1024 * 1024 * 1024;
  const savedGb = p2pBytes / bytesInGb;
  const estimatedSavingsUsd = savedGb * costPerGb;
  return {
    savedGb: Math.round(savedGb * 1000) / 1000,
    estimatedSavingsUsd: Math.round(estimatedSavingsUsd * 1000) / 1000,
  };
}
