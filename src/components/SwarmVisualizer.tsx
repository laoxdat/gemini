import React, { useEffect, useRef, useState } from 'react';
import { PeerInfo } from '../types/p2p';
import { formatBytes } from '../utils/formatters';
import { Network, Server, Laptop, Activity, Users } from 'lucide-react';

interface SwarmVisualizerProps {
  peers: PeerInfo[];
  httpActive: boolean;
  p2pActive: boolean;
  httpBytes: number;
  p2pBytes: number;
  swarmId?: string;
}

interface Particle {
  id: number;
  from: 'cdn' | string;
  to: 'local' | string;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

export const SwarmVisualizer: React.FC<SwarmVisualizerProps> = ({
  peers,
  httpActive,
  p2pActive,
  httpBytes,
  p2pBytes,
  swarmId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef<number>(1);
  const [selectedPeer, setSelectedPeer] = useState<PeerInfo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastSpawnTime = 0;

    const render = (time: number) => {
      // Responsive canvas size matching container
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + 15;
      const cdnX = width / 2;
      const cdnY = 38;

      // Spawn particles periodically based on activity
      if (time - lastSpawnTime > 160) {
        lastSpawnTime = time;

        // CDN to local particle
        if (httpActive || Math.random() < 0.25) {
          particlesRef.current.push({
            id: nextParticleIdRef.current++,
            from: 'cdn',
            to: 'local',
            progress: 0,
            speed: 0.02 + Math.random() * 0.015,
            color: '#38bdf8', // sky-400
          });
        }

        // P2P peer particles
        if (peers.length > 0 && (p2pActive || Math.random() < 0.4)) {
          const randomPeer = peers[Math.floor(Math.random() * peers.length)];
          const isDownload = Math.random() > 0.4;
          particlesRef.current.push({
            id: nextParticleIdRef.current++,
            from: isDownload ? randomPeer.id : 'local',
            to: isDownload ? 'local' : randomPeer.id,
            progress: 0,
            speed: 0.025 + Math.random() * 0.02,
            color: '#10b981', // emerald-500
          });
        }
      }

      // Compute peer node positions in a circle around local peer
      const peerPositions = new Map<string, { x: number; y: number }>();
      const radius = Math.min(width * 0.35, 120);

      peers.forEach((peer, index) => {
        const total = Math.max(peers.length, 3);
        const angle = (index * (2 * Math.PI)) / total + Math.PI / 2;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle) * 0.8;
        peerPositions.set(peer.id, { x: px, y: py });
      });

      // 1. Draw Connection Lines: CDN -> Local
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(cdnX, cdnY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Connection Lines: Peers <-> Local & Peer to Peer mesh
      peers.forEach((peer) => {
        const pos = peerPositions.get(peer.id);
        if (!pos) return;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      });

      // Inter-peer mesh subtle lines if >= 2 peers
      if (peers.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < peers.length; i++) {
          const p1 = peerPositions.get(peers[i].id);
          const p2 = peerPositions.get(peers[(i + 1) % peers.length].id);
          if (p1 && p2) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
        ctx.stroke();
      }

      // 3. Update & Draw Particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.progress += particle.speed;
        if (particle.progress >= 1) return false;

        let startX = 0,
          startY = 0,
          endX = 0,
          endY = 0;

        if (particle.from === 'cdn' && particle.to === 'local') {
          startX = cdnX;
          startY = cdnY;
          endX = centerX;
          endY = centerY;
        } else if (particle.from === 'local') {
          startX = centerX;
          startY = centerY;
          const pos = peerPositions.get(particle.to);
          if (!pos) return false;
          endX = pos.x;
          endY = pos.y;
        } else if (particle.to === 'local') {
          const pos = peerPositions.get(particle.from);
          if (!pos) return false;
          startX = pos.x;
          startY = pos.y;
          endX = centerX;
          endY = centerY;
        }

        const currX = startX + (endX - startX) * particle.progress;
        const currY = startY + (endY - startY) * particle.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      // 4. Draw CDN Server Node
      ctx.beginPath();
      ctx.arc(cdnX, cdnY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // CDN Text
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.fillText('CDN Origin', cdnX, cdnY - 24);

      // 5. Draw Local Node (Center)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glow pulse for local node
      ctx.beginPath();
      ctx.arc(centerX, centerY, 28 + Math.sin(time / 250) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#e0e7ff';
      ctx.fillText('Bạn (Local Peer)', centerX, centerY + 36);

      // 6. Draw Remote Peer Nodes
      peers.forEach((peer, idx) => {
        const pos = peerPositions.get(peer.id);
        if (!pos) return;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#064e3b';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`Peer #${idx + 1}`, pos.x, pos.y + 24);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [peers, httpActive, p2pActive]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Mô hình mạng Swarm P2P (Live Network Topology)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <Users className="w-3.5 h-3.5" />
            {peers.length} Peers kết nối
          </span>
        </div>
      </div>

      <div className="relative w-full h-[220px] bg-slate-950/90 rounded-lg overflow-hidden border border-slate-800/80">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend overlays */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800/60 pointer-events-none">
          <div className="flex items-center gap-1.5 text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>HTTP CDN: {formatBytes(httpBytes)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>P2P Swarm: {formatBytes(p2pBytes)}</span>
          </div>
        </div>

        {swarmId && (
          <div className="absolute bottom-2 right-2 text-[10px] bg-slate-900/80 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
            Swarm ID: <span className="font-mono text-slate-300">{swarmId}</span>
          </div>
        )}
      </div>

      {/* Peer Summary Chips */}
      {peers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {peers.map((peer, idx) => (
            <button
              key={peer.id}
              onClick={() => setSelectedPeer(selectedPeer?.id === peer.id ? null : peer)}
              className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                selectedPeer?.id === peer.id
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Laptop className="w-3 h-3 text-emerald-400" />
              <span>Peer #{idx + 1}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({formatBytes(peer.bytesReceived)} nhận)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
