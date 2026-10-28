import React, { useState } from 'react';
import { IceServerConfig, DEFAULT_ICE_SERVERS, isValidIceServerUrl } from '../utils/config';
import { Shield, Plus, Trash2, Globe, AlertCircle, HelpCircle } from 'lucide-react';

interface StunManagerProps {
  iceServers: IceServerConfig[];
  onUpdateIceServers: (servers: IceServerConfig[]) => void;
  onApplyReload: () => void;
}

export const StunManager: React.FC<StunManagerProps> = ({
  iceServers,
  onUpdateIceServers,
  onApplyReload,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newUrl.trim();
    if (!trimmed) return;

    if (!isValidIceServerUrl(trimmed)) {
      setErrorMsg('Địa chỉ phải bắt đầu bằng stun: hoặc turn:');
      return;
    }

    if (iceServers.some((s) => s.urls.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Máy chủ ICE này đã có trong danh sách');
      return;
    }

    const newServer: IceServerConfig = {
      id: `ice-${Date.now()}`,
      urls: trimmed,
      username: newUsername.trim() || undefined,
      credential: newCredential.trim() || undefined,
      enabled: true,
    };

    onUpdateIceServers([...iceServers, newServer]);
    setNewUrl('');
    setNewUsername('');
    setNewCredential('');
  };

  const handleToggle = (id: string) => {
    onUpdateIceServers(
      iceServers.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateIceServers(iceServers.filter((s) => s.id !== id));
  };

  const handleResetDefaults = () => {
    onUpdateIceServers(DEFAULT_ICE_SERVERS);
  };

  const enabledCount = iceServers.filter((s) => s.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            Máy chủ STUN / TURN (ICE Servers) ({enabledCount}/{iceServers.length} kích hoạt)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác định địa chỉ IP công khai và vượt qua tường lửa NAT để kết nối WebRTC trực tiếp
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="text-xs text-slate-400 hover:text-slate-200 underline"
        >
          Mặc định
        </button>
      </div>

      {/* Add Server Form */}
      <form onSubmit={handleAddServer} className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="stun:stun.example.com:19302 hoặc turn:turn.example.com:3478"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username (tùy chọn cho TURN)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <input
              type="password"
              value={newCredential}
              onChange={(e) => setNewCredential(e.target.value)}
              placeholder="Credential / Secret"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}
      </form>

      {/* List of ICE Servers */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
        {iceServers.map((server) => {
          const isTurn = server.urls.startsWith('turn');
          return (
            <div
              key={server.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                server.enabled
                  ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={() => handleToggle(server.id)}
                  aria-label={`Bật server ${server.urls}`}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 w-3.5 h-3.5"
                />
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    isTurn
                      ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                      : 'bg-sky-950 text-sky-300 border border-sky-800/60'
                  }`}
                >
                  {isTurn ? 'TURN' : 'STUN'}
                </span>
                <span className="font-mono truncate" title={server.urls}>
                  {server.urls}
                </span>
                {server.username && (
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    user: {server.username}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(server.id)}
                title="Xoá máy chủ"
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Action */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>STUN của Google và Cloudflare mặc định mở cổng P2P NAT trên hầu hết mạng gia đình và 4G/5G</span>
        </div>
        <button
          onClick={onApplyReload}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          Áp dụng & Tải lại
        </button>
      </div>
    </div>
  );
};
