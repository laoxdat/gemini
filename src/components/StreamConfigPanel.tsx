import React, { useState } from 'react';
import {
  StreamPreset,
  DEFAULT_STREAM_PRESETS,
  P2PEngineSettings,
  isValidHlsUrl,
  generateSwarmId,
} from '../utils/config';
import {
  Play,
  Film,
  Sliders,
  Sparkles,
  AlertCircle,
  Hash,
  Share2,
  Tv,
  Check,
} from 'lucide-react';

interface StreamConfigPanelProps {
  currentUrl: string;
  onSelectStream: (url: string, presetName?: string) => void;
  engineSettings: P2PEngineSettings;
  onUpdateEngineSettings: (settings: P2PEngineSettings) => void;
  onApplyReload: () => void;
  activePresetId?: string;
}

export const StreamConfigPanel: React.FC<StreamConfigPanelProps> = ({
  currentUrl,
  onSelectStream,
  engineSettings,
  onUpdateEngineSettings,
  onApplyReload,
  activePresetId,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [errorMsg, setErrorMsg] = useState('');
  const [customSwarmId, setCustomSwarmId] = useState(engineSettings.swarmId || '');

  const handlePresetClick = (preset: StreamPreset) => {
    setInputUrl(preset.url);
    setErrorMsg('');
    onSelectStream(preset.url, preset.name);
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập URL luồng video');
      return;
    }
    if (!isValidHlsUrl(trimmed)) {
      setErrorMsg('URL không đúng định dạng HLS (.m3u8)');
      return;
    }
    setErrorMsg('');
    onSelectStream(trimmed, 'Custom HLS Stream');
  };

  const handleGenerateNewSwarm = () => {
    const newSwarm = generateSwarmId(inputUrl);
    setCustomSwarmId(newSwarm);
    onUpdateEngineSettings({
      ...engineSettings,
      swarmId: newSwarm,
    });
  };

  const handleSettingChange = <K extends keyof P2PEngineSettings>(
    key: K,
    value: P2PEngineSettings[K]
  ) => {
    onUpdateEngineSettings({
      ...engineSettings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            Các luồng video HLS mẫu sẵn (Presets):
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEFAULT_STREAM_PRESETS.map((preset) => {
            const isSelected = currentUrl === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-1">
                  <span className="font-semibold truncate">{preset.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      preset.category === 'Live'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {preset.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {preset.description}
                </div>
                <div className="mt-1 text-[10px] text-indigo-300 font-mono">
                  {preset.resolution}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom URL Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Nhập đường dẫn luồng HLS (.m3u8) tuỳ chỉnh:
        </label>
        <form onSubmit={handleSubmitUrl} className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="https://example.com/playlist.m3u8"
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Tải luồng
          </button>
        </form>
        {errorMsg && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}
      </div>

      {/* 3. Swarm Channel ID */}
      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            Mã định danh nhóm Swarm (Swarm ID):
          </label>
          <button
            type="button"
            onClick={handleGenerateNewSwarm}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Tạo mới
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">
          Các tab hoặc người xem có cùng Swarm ID và luồng video sẽ tự động kết nối và chia sẻ băng thông với nhau.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customSwarmId}
            onChange={(e) => {
              setCustomSwarmId(e.target.value);
              handleSettingChange('swarmId', e.target.value.trim());
            }}
            placeholder="vd: p2p-demo-channel-1"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 4. P2P Engine Core Parameters */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-3.5">
        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          Tham số động P2P Media Loader Engine
        </h4>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <input
              type="checkbox"
              checked={engineSettings.isP2PEnabled}
              onChange={(e) => handleSettingChange('isP2PEnabled', e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-xs text-slate-200 font-medium">Bật chia sẻ P2P</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <input
              type="checkbox"
              checked={engineSettings.isUploadEnabled}
              onChange={(e) => handleSettingChange('isUploadEnabled', e.target.checked)}
              className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-xs text-slate-200 font-medium">Bật tải lên (Upload)</span>
          </label>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-1">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Cửa sổ ưu tiên cấp thiết (High Demand Window):</span>
              <span className="font-mono text-amber-400 font-semibold">
                {engineSettings.highDemandTimeWindow}s
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="5"
              value={engineSettings.highDemandTimeWindow}
              onChange={(e) =>
                handleSettingChange('highDemandTimeWindow', Number(e.target.value))
              }
              aria-label="Cửa sổ ưu tiên cấp thiết"
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Các phân đoạn sắp phát trong khoảng này ưu tiên tải nhanh từ CDN để tránh giật hình.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Cửa sổ tải trước P2P (P2P Download Window):</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {engineSettings.p2pDownloadTimeWindow}s
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={engineSettings.p2pDownloadTimeWindow}
              onChange={(e) =>
                handleSettingChange('p2pDownloadTimeWindow', Number(e.target.value))
              }
              aria-label="Cửa sổ tải trước P2P"
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Khoảng thời gian trong tương lai tải trước dữ liệu từ các Peer trong mạng.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Số tải P2P đồng thời tối đa:</span>
              <span className="font-mono text-sky-400 font-semibold">
                {engineSettings.simultaneousP2PDownloads}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={engineSettings.simultaneousP2PDownloads}
              onChange={(e) =>
                handleSettingChange('simultaneousP2PDownloads', Number(e.target.value))
              }
              aria-label="Số tải P2P đồng thời tối đa"
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        type="button"
        onClick={onApplyReload}
        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Áp dụng cấu hình và khởi động lại luồng
      </button>
    </div>
  );
};
