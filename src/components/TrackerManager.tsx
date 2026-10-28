import React, { useState } from 'react';
import { TrackerConfig, DEFAULT_TRACKERS, isValidTrackerUrl } from '../utils/config';
import { Radio, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface TrackerManagerProps {
  trackers: TrackerConfig[];
  onUpdateTrackers: (trackers: TrackerConfig[]) => void;
  onApplyReload: () => void;
}

export const TrackerManager: React.FC<TrackerManagerProps> = ({
  trackers,
  onUpdateTrackers,
  onApplyReload,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleAddTracker = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newUrl.trim();
    if (!trimmed) return;

    if (!isValidTrackerUrl(trimmed)) {
      setErrorMsg('Địa chỉ tracker phải bắt đầu bằng wss:// hoặc ws://');
      return;
    }

    if (trackers.some((t) => t.url.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Tracker này đã tồn tại trong danh sách');
      return;
    }

    const newTracker: TrackerConfig = {
      id: `tracker-${Date.now()}`,
      url: trimmed,
      enabled: true,
      status: 'idle',
    };

    onUpdateTrackers([...trackers, newTracker]);
    setNewUrl('');
  };

  const handleToggle = (id: string) => {
    onUpdateTrackers(
      trackers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateTrackers(trackers.filter((t) => t.id !== id));
  };

  const handleResetDefaults = () => {
    onUpdateTrackers(DEFAULT_TRACKERS);
  };

  const handleTestTracker = (tracker: TrackerConfig) => {
    setTestingId(tracker.id);
    const start = performance.now();
    try {
      const ws = new WebSocket(tracker.url);
      const timeout = setTimeout(() => {
        ws.close();
        onUpdateTrackers(
          trackers.map((t) =>
            t.id === tracker.id ? { ...t, status: 'error', pingMs: undefined } : t
          )
        );
        setTestingId(null);
      }, 4000);

      ws.onopen = () => {
        clearTimeout(timeout);
        const ping = Math.round(performance.now() - start);
        ws.close();
        onUpdateTrackers(
          trackers.map((t) =>
            t.id === tracker.id ? { ...t, status: 'connected', pingMs: ping } : t
          )
        );
        setTestingId(null);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        onUpdateTrackers(
          trackers.map((t) =>
            t.id === tracker.id ? { ...t, status: 'error', pingMs: undefined } : t
          )
        );
        setTestingId(null);
      };
    } catch {
      onUpdateTrackers(
        trackers.map((t) =>
          t.id === tracker.id ? { ...t, status: 'error', pingMs: undefined } : t
        )
      );
      setTestingId(null);
    }
  };

  const enabledCount = trackers.filter((t) => t.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Máy chủ WebTorrent Trackers ({enabledCount}/{trackers.length} kích hoạt)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Trackers qua WebSocket điều phối trao đổi tín hiệu WebRTC giữa các client trong Swarm
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="text-xs text-slate-400 hover:text-slate-200 underline"
        >
          Mặc định
        </button>
      </div>

      {/* Add Tracker Form */}
      <form onSubmit={handleAddTracker} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="wss://tracker.example.com"
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm
          </button>
        </div>
        {errorMsg && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}
      </form>

      {/* Tracker List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
        {trackers.map((tracker) => {
          const isTesting = testingId === tracker.id;
          return (
            <div
              key={tracker.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                tracker.enabled
                  ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                <input
                  type="checkbox"
                  checked={tracker.enabled}
                  onChange={() => handleToggle(tracker.id)}
                  aria-label={`Bật tracker ${tracker.url}`}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 w-3.5 h-3.5"
                />
                <span className="font-mono truncate" title={tracker.url}>
                  {tracker.url}
                </span>
                {tracker.status === 'connected' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {tracker.pingMs ? `${tracker.pingMs}ms` : 'Online'}
                  </span>
                )}
                {tracker.status === 'error' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Không phản hồi
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTestTracker(tracker)}
                  disabled={isTesting || !tracker.enabled}
                  title="Kiểm tra kết nối WebSocket"
                  className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tracker.id)}
                  title="Xoá tracker"
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful tip & Apply button */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Thay đổi tracker cần khởi động lại P2P Engine để kết nối lại Swarm</span>
        </div>
        <button
          onClick={onApplyReload}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          Áp dụng & Tải lại
        </button>
      </div>
    </div>
  );
};
