import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Folder, Zap, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';

/* ─── Animated Aurora Canvas Background ─── */
const AuroraCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.2, y: 0.3, r: 0.45, hue: 190, speed: 0.0003, ox: 0.06, oy: 0.08 },
      { x: 0.75, y: 0.2, r: 0.4, hue: 260, speed: 0.0004, ox: 0.07, oy: 0.05 },
      { x: 0.5, y: 0.75, r: 0.5, hue: 160, speed: 0.00025, ox: 0.05, oy: 0.09 },
      { x: 0.85, y: 0.7, r: 0.35, hue: 300, speed: 0.00035, ox: 0.08, oy: 0.06 },
      { x: 0.1, y: 0.8, r: 0.38, hue: 210, speed: 0.0005, ox: 0.06, oy: 0.07 },
    ];

    const draw = () => {
      t++;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#03050e';
      ctx.fillRect(0, 0, W, H);

      blobs.forEach((b, i) => {
        const px = (b.x + Math.sin(t * b.speed * 1.3 + i) * b.ox) * W;
        const py = (b.y + Math.cos(t * b.speed + i * 1.7) * b.oy) * H;
        const r = b.r * Math.min(W, H);
        const hShift = Math.sin(t * 0.001 + i) * 30;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `hsla(${b.hue + hShift}, 80%, 60%, 0.18)`);
        grad.addColorStop(0.4, `hsla(${b.hue + hShift + 20}, 70%, 50%, 0.10)`);
        grad.addColorStop(1, `hsla(${b.hue}, 60%, 40%, 0)`);

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Scanline vignette
      ctx.globalCompositeOperation = 'source-over';
      const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(2,4,12,0.7)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        zIndex: 0, display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
};

/* ─── Main Component ─── */
export const DashboardGrid: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const projects = useStore((state) => state.projects);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brief?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .dg-root {
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          position: relative;
          padding: 52px 36px 80px;
          color: #e8edf5;
          overflow-x: hidden;
        }

        .dg-inner {
          position: relative;
          z-index: 1;
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 44px;
        }

        /* ── Top bar ── */
        .dg-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .dg-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(56,200,180,0.08);
          border: 1px solid rgba(56,200,180,0.25);
          border-radius: 100px;
          padding: 5px 14px 5px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #38c8b4;
          letter-spacing: 0.06em;
          margin-bottom: 16px;
        }

        .dg-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #38c8b4;
          box-shadow: 0 0 8px #38c8b4;
          animation: livepulse 1.8s ease-in-out infinite;
        }

        @keyframes livepulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .dg-title {
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0 0 10px 0;
          color: #ffffff;
          text-shadow: 0 0 60px rgba(100,180,255,0.2);
        }

        .dg-title em {
          font-style: normal;
          background: linear-gradient(100deg, #38c8b4 0%, #5ba3f5 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200%;
          animation: shimmer 4s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .dg-sub {
          font-size: 16px;
          font-weight: 300;
          color: rgba(200,215,235,0.5);
          margin: 0;
          max-width: 440px;
          line-height: 1.7;
        }

        /* ── New Project button ── */
        .btn-new {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 28px;
          border: none;
          border-radius: 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #03050e;
          cursor: pointer;
          background: linear-gradient(135deg, #38c8b4, #5ba3f5);
          box-shadow: 0 6px 30px rgba(56,200,180,0.3);
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          white-space: nowrap;
          flex-shrink: 0;
          overflow: hidden;
        }

        .btn-new::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
          pointer-events: none;
        }

        .btn-new:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(56,200,180,0.45);
        }

        .btn-new:active { transform: scale(0.97); }

        /* ── Search + stats row ── */
        .dg-controls {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }

        .dg-search-wrap {
          flex: 1;
          min-width: 240px;
          position: relative;
        }

        .dg-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(150,180,220,0.4);
          pointer-events: none;
          transition: color 0.2s;
        }

        .dg-search-wrap:focus-within .dg-search-icon {
          color: #38c8b4;
        }

        .dg-search-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 15px 18px 15px 52px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #e8edf5;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }

        .dg-search-input::placeholder { color: rgba(150,180,220,0.25); }

        .dg-search-input:focus {
          border-color: rgba(56,200,180,0.4);
          background: rgba(56,200,180,0.04);
          box-shadow: 0 0 0 4px rgba(56,200,180,0.08), 0 2px 20px rgba(0,0,0,0.3);
        }

        .dg-stat-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 13px 20px;
          white-space: nowrap;
        }

        .dg-stat-icon { color: #5ba3f5; }

        .dg-stat-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(150,180,220,0.5);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .dg-stat-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 500;
          color: #ffffff;
        }

        /* ── Section header ── */
        .dg-section-head {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dg-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(150,180,220,0.4);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .dg-section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(255,255,255,0.07) 0%, transparent 100%);
        }

        /* ── Grid ── */
        .dg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        /* ── Empty State ── */
        .dg-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 90px 32px;
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 28px;
          background: rgba(255,255,255,0.015);
          backdrop-filter: blur(20px);
          gap: 14px;
          animation: fadeslide 0.4s ease;
        }

        @keyframes fadeslide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dg-empty-orb {
          width: 80px; height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(56,200,180,0.1), rgba(91,163,245,0.1));
          border: 1px solid rgba(56,200,180,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #38c8b4;
          margin-bottom: 4px;
          position: relative;
        }

        .dg-empty-orb::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(56,200,180,0.3), transparent 60%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding: 1px;
        }

        .dg-empty-title {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .dg-empty-sub {
          font-size: 14px;
          font-weight: 300;
          color: rgba(200,215,235,0.4);
          margin: 0;
          max-width: 300px;
          line-height: 1.7;
        }

        .btn-ghost-teal {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(56,200,180,0.06);
          border: 1px solid rgba(56,200,180,0.25);
          border-radius: 12px;
          padding: 11px 22px;
          color: #38c8b4;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }

        .btn-ghost-teal:hover {
          background: rgba(56,200,180,0.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(56,200,180,0.15);
        }

        @media (max-width: 640px) {
          .dg-root { padding: 32px 18px 60px; }
          .dg-topbar { flex-direction: column; align-items: flex-start; }
          .dg-controls { flex-direction: column; }
          .dg-stat-pill { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Live aurora background */}
      <AuroraCanvas />

      <div className="dg-root">
        <div className="dg-inner">

          {/* ── Header ── */}
          <div className="dg-topbar">
            <div>
              <div className="dg-badge">
                <span className="dg-badge-dot" />
                system · live
              </div>
              <h1 className="dg-title">
                Your <em>Projects</em>
              </h1>
              <p className="dg-sub">
                Node-based workflows, team assignments, and everything in between — in one place.
              </p>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="btn-new">
              <Plus size={18} strokeWidth={2.5} />
              New Project
            </button>
          </div>

          {/* ── Controls ── */}
          <div className="dg-controls">
            <div className="dg-search-wrap">
              <Search className="dg-search-icon" size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or brief…"
                className="dg-search-input"
                aria-label="Search projects"
              />
            </div>

            <div className="dg-stat-pill">
              <Folder className="dg-stat-icon" size={16} />
              <span className="dg-stat-label">Projects</span>
              <span className="dg-stat-val">{String(projects.length).padStart(2, '0')}</span>
            </div>
          </div>

          {/* ── Section label ── */}
          <div className="dg-section-head">
            <span className="dg-section-label">
              {searchQuery
                ? `${filteredProjects.length} match${filteredProjects.length !== 1 ? 'es' : ''} found`
                : 'all projects'}
            </span>
            <div className="dg-section-line" />
          </div>

          {/* ── Content ── */}
          {filteredProjects.length > 0 ? (
            <div className="dg-grid">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="dg-empty">
              <div className="dg-empty-orb">
                <Zap size={32} strokeWidth={1.5} />
              </div>
              <h3 className="dg-empty-title">
                {searchQuery ? 'No matches' : 'Nothing here yet'}
              </h3>
              <p className="dg-empty-sub">
                {searchQuery
                  ? `No projects matched "${searchQuery}". Try a different keyword.`
                  : 'Kick things off by initializing your first node-based workflow.'}
              </p>
              {!searchQuery && (
                <button onClick={() => setIsModalOpen(true)} className="btn-ghost-teal">
                  Get started <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};