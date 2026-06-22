'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import { Shield, Target, Activity, Hexagon, Component, CheckCircle2, Layers, Cpu, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import {
  DASHBOARD_PATH,
  PIPELINE_EXECUTION_ANCHOR,
  PIPELINE_EXECUTION_PATH,
  clearCommandCenterNavigationState,
  navigateToAppPath,
} from '../lib/navigation';
import { WalletConnectControl } from '../components/WalletConnectControl';
import { scanRecentThreats, relativeTime, type ScannedThreat } from '../lib/threatScan';
import LivePipeline from '../components/LivePipeline';
import ModelComparison from '../components/ModelComparison';
import VaultBeforeAfter from '../components/VaultBeforeAfter';
import GasSavingsCounter from '../components/GasSavingsCounter';

// ─── Variants ────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 60, filter: 'blur(8px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.0, ease: EASE },
  },
};

const fadeUpB = {
  hidden: { opacity: 0, y: 50, filter: 'blur(6px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.0, ease: EASE, delay: 0.15 },
  },
};

const fadeUpC = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.1, ease: EASE, delay: 0.3 },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const reveal = {
  hidden: { opacity: 0, scale: 1.06, filter: 'blur(12px)' },
  visible: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE },
  },
};

const vp = { once: true, margin: '-80px' };

// ─── Deterministic particles (avoids SSR mismatch) ───────────────────────────

const PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  y: (i * 53 + 7) % 100,
  size: (i % 3) + 1,
  duration: 15 + (i * 7) % 20,
  delay: (i * 3) % 10,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

function AmbientParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#10B981]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -70, 0], opacity: [0.05, 0.2, 0.05], scale: [1, 1.4, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function CursorGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const sy = useSpring(mouseY, { stiffness: 40, damping: 25 });

  useEffect(() => {
    const move = (e: MouseEvent) => { mouseX.set(e.clientX - 300); mouseY.set(e.clientY - 300); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0 w-[600px] h-[600px] rounded-full"
      style={{ x: sx, y: sy, background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
    />
  );
}

function MagneticBtn({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  return (
    <motion.button
      type="button"
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.25);
        y.set((e.clientY - r.top - r.height / 2) * 0.25);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

const FirstLoadPreloader = ({ onDismiss }: { onDismiss?: () => void }) => (
  <div
    className="fixed inset-0 z-[140] bg-[#050507] flex items-center justify-center p-6 animate-[preloaderFadeOut_0.5s_ease-out_4s_forwards]"
    onClick={onDismiss}
  >
    <div className="w-full max-w-sm border border-[#10B981]/30 bg-black/80 rounded-2xl p-6 shadow-[0_0_70px_rgba(16,185,129,0.16)]">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-xs uppercase tracking-[0.35em] text-[#10B981]">Initializing</span>
      </div>
      <div className="space-y-3 text-xs text-gray-300">
        <div className="flex items-center justify-between border-b border-white/5 pb-2"><span>MANTLE RPC</span><span className="text-[#10B981]">SYNC</span></div>
        <div className="flex items-center justify-between border-b border-white/5 pb-2"><span>WALLET BRIDGE</span><span className="text-[#10B981]">READY</span></div>
        <div className="flex items-center justify-between"><span>COMMAND CENTER</span><span className="text-[#10B981]">ONLINE</span></div>
      </div>
    </div>
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string; txHash: string; protocol: string; type: string;
  gasSaved: string; status: 'SCANNING' | 'PROPOSED' | 'SAFE'; timestamp: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', txHash: '0x8f2a...9aac', protocol: 'MantleSwap', type: 'Reentrancy', gasSaved: 'response package ready', status: 'PROPOSED', timestamp: '2 mins ago' },
  { id: '2', txHash: '0x1b4d...2ccf', protocol: 'LendX Protocol', type: 'Flash Loan Attack', gasSaved: 'multisig review queued', status: 'SCANNING', timestamp: '3 mins ago' },
  { id: '3', txHash: '0xd5e9...3f72', protocol: 'YieldFlow', type: 'Oracle Manipulation', gasSaved: 'response package ready', status: 'PROPOSED', timestamp: '5 mins ago' },
  { id: '4', txHash: '0x7a43...81ce', protocol: 'ApexVaults', type: 'Normal Transfer', gasSaved: '-', status: 'SAFE', timestamp: '7 mins ago' },
  { id: '5', txHash: '0x48ce...eB7a', protocol: 'LiquidMNT', type: 'Reentrancy', gasSaved: 'multisig review queued', status: 'SCANNING', timestamp: '11 mins ago' },
  { id: '6', txHash: '0x9f2b...4e6a', protocol: 'MantleBridge', type: 'Normal Transfer', gasSaved: '-', status: 'SAFE', timestamp: '14 mins ago' },
  { id: '7', txHash: '0x3c1a...d9f8', protocol: 'MantleSwap', type: 'Oracle Manipulation', gasSaved: 'response package ready', status: 'PROPOSED', timestamp: '18 mins ago' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [codeTab, setCodeTab] = useState<'python' | 'typescript'>('python');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isLaunchingCommandCenter, setIsLaunchingCommandCenter] = useState(false);
  const [showFirstLoadPreloader, setShowFirstLoadPreloader] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1500], [0, -350]);
  const decorY = useTransform(scrollY, [0, 1500], [0, -220]);
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0.25]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.96]);

  const { isConnected, chainId } = useAccount();
  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { router.prefetch('/dashboard'); router.prefetch('/history'); }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowFirstLoadPreloader(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  // CSS fallback: hide preloader after 5s even if JS never runs
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = '@keyframes plFade{0%,85%{opacity:1}100%{opacity:0;pointer-events:none}}.pl-auto{animation:plFade .5s ease-out 5s forwards}';
    document.head.appendChild(style);
    document.querySelector('.fixed.inset-0.z-\\[140\\]')?.classList.add('pl-auto');
    return () => style.remove();
  }, []);

  useEffect(() => {
    const reset = () => {
      setIsLaunchingCommandCenter(false);
      clearCommandCenterNavigationState(window.sessionStorage);
    };
    const wasDisconnected = new URLSearchParams(window.location.search).get('wallet') === 'disconnected';
    if (wasDisconnected || window.location.pathname === '/') window.setTimeout(reset, 0);
    window.addEventListener('pageshow', reset);
    window.addEventListener('popstate', reset);
    return () => { window.removeEventListener('pageshow', reset); window.removeEventListener('popstate', reset); };
  }, []);

  useEffect(() => {
    if (isLaunchingCommandCenter && isConnected && isCorrectNetwork) navigateToAppPath(window.location, DASHBOARD_PATH);
  }, [isLaunchingCommandCenter, isConnected, isCorrectNetwork]);

  const beginCommandCenterLaunch = () => {
    setIsLaunchingCommandCenter(true);
    window.sessionStorage.setItem('breachresponse_launching_command_center', 'true');
  };
  const handleCommandCenterAccess = () => { beginCommandCenterLaunch(); navigateToAppPath(window.location, DASHBOARD_PATH); };

  useEffect(() => {
    // Real ledger: sample recent Mantle blocks, score each tx heuristically,
    // then classify the suspicious ones with Groq via /api/analyze.
    // Shared with the Threat History page through src/lib/threatScan.
    let cancelled = false;

    const toTx = (t: ScannedThreat): Transaction => {
      const aiTag = t.aiAnalyzed && typeof t.aiConfidence === 'number'
        ? ` (AI: ${(t.aiConfidence * 100).toFixed(0)}%)`
        : '';
      return {
        id: t.id,
        txHash: t.txHash.length > 14 ? `${t.txHash.slice(0, 8)}...${t.txHash.slice(-4)}` : t.txHash,
        protocol: t.protocol,
        type: t.type === 'Normal Transfer' ? 'Normal Transfer' : `${t.type}${aiTag}`,
        gasSaved: t.status === 'SAFE' ? '-' : t.gasSaved,
        status: t.status,
        timestamp: relativeTime(t.timestamp),
      };
    };

    const runScan = async () => {
      if (cancelled || document.hidden) return;
      try {
        const scanned = await scanRecentThreats({ blockCount: 4, txPerBlock: 8, maxAiCalls: 3 });
        if (cancelled || scanned.length === 0) return;
        // Surface threats first so the ledger leads with AI-classified incidents.
        const ordered = [...scanned].sort((a, b) => (a.status === 'SAFE' ? 1 : 0) - (b.status === 'SAFE' ? 1 : 0));
        setTransactions(ordered.slice(0, 7).map(toTx));
      } catch {
        // Keep the seeded initialTransactions on any RPC/AI failure.
      }
    };

    const idleWindow = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(runScan);
    else setTimeout(runScan, 300);

    const interval = setInterval(() => {
      if (!document.hidden) runScan();
    }, 60000);

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white font-mono overflow-x-hidden selection:bg-[#10B981] selection:text-black relative">
      {showFirstLoadPreloader && <FirstLoadPreloader onDismiss={() => setShowFirstLoadPreloader(false)} />}
      {mounted && <AmbientParticles />}
      {mounted && <CursorGlow />}

      <div className="fixed inset-0 bg-engineer-grid opacity-[0.12] pointer-events-none z-0 vignette-mask" />
      <motion.div style={{ y: bgY }} className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#10B981]/4 rounded-full blur-[160px] pointer-events-none z-0" />
      <motion.div style={{ y: decorY }} className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[800px] h-[800px] bg-[#10B981]/3 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: EASE }}
        className="absolute w-full flex justify-between items-center py-6 px-8 md:px-16 z-50"
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="BreachResponse Logo" width={32} height={32} className="object-contain" />
          <span className="text-lg font-bold tracking-widest text-white drop-shadow-md">BREACH RESPONSE</span>
        </div>
        <div className="hidden md:flex gap-8 text-xs tracking-widest uppercase font-bold text-gray-300">
          <Link href={PIPELINE_EXECUTION_PATH} className="hover:text-white transition-colors duration-500">Features</Link>
          <a href="https://docs.breachresponse.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-500">Documentation</a>
        </div>
        <div>
          <WalletConnectControl
            disconnectedLabel="Connect and Enter"
            onBeforeConnect={beginCommandCenterLaunch}
            onConnectedClick={handleCommandCenterAccess}
            className="bg-[#10B981] text-black px-6 py-2.5 rounded text-sm font-bold hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-500 shadow-lg flex items-center gap-2"
            connectedClassName="bg-black/50 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded text-sm font-bold hover:border-[#10B981] hover:text-[#10B981] transition-all duration-500 shadow-lg flex items-center gap-2"
            connectedLabel="Command Center"
          />
        </div>
      </motion.nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#050505]">
        <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg width="840" height="840" viewBox="0 0 840 840" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120%] h-[120%] max-w-none md:w-[840px] md:h-[840px]">
            <circle cx="420" cy="420" r="100" stroke="#10B981" strokeWidth="1" strokeDasharray="4 8" className="opacity-40" />
            <circle cx="420" cy="420" r="220" stroke="#10B981" strokeWidth="1" className="opacity-20" />
            <circle cx="420" cy="420" r="340" stroke="#10B981" strokeWidth="1" strokeDasharray="10 15" className="opacity-30" />
            <circle cx="420" cy="420" r="380" stroke="#10B981" strokeWidth="1" className="opacity-20" />
            <path d="M 170 170 L 670 670" stroke="#10B981" strokeWidth="1" className="opacity-25" />
            <path d="M 670 170 L 170 670" stroke="#10B981" strokeWidth="1" strokeDasharray="5 5" className="opacity-15" />
            <path d="M 420 40 L 420 800" stroke="#10B981" strokeWidth="1" className="opacity-10" />
            <path d="M 40 420 L 800 420" stroke="#10B981" strokeWidth="1" className="opacity-10" />
            <circle cx="300" cy="300" r="4" fill="#10B981" className="opacity-60" />
            <circle cx="600" cy="600" r="3" fill="#10B981" className="opacity-40" />
            <circle cx="270" cy="570" r="5" fill="#10B981" className="opacity-50" />
            <circle cx="540" cy="300" r="4" fill="#10B981" className="opacity-70" />
            <line x1="420" y1="220" x2="430" y2="220" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="420" y1="620" x2="430" y2="620" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="220" y1="420" x2="220" y2="430" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="620" y1="420" x2="620" y2="430" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <text x="420" y="25" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="middle" className="opacity-50 font-bold">000</text>
            <text x="420" y="828" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="middle" className="opacity-50 font-bold">180</text>
            <text x="834" y="423" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="start" className="opacity-50 font-bold">090</text>
            <text x="6" y="423" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="end" className="opacity-50 font-bold">270</text>
            <text x="695" y="145" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">045</text>
            <text x="695" y="705" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">135</text>
            <text x="145" y="705" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">225</text>
            <text x="145" y="145" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">315</text>
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180;
              const longTick = i % 3 === 0;
              const fmt = (v: number) => Number(v.toFixed(3));
              const x1 = fmt(420 + 380 * Math.cos(angle)); const y1 = fmt(420 + 380 * Math.sin(angle));
              const x2 = fmt(420 + (380 - (longTick ? 8 : 4)) * Math.cos(angle)); const y2 = fmt(420 + (380 - (longTick ? 8 : 4)) * Math.sin(angle));
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10B981" strokeWidth="1" className={longTick ? 'opacity-30' : 'opacity-15'} />;
            })}
          </svg>
        </motion.div>

        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#09090B] via-transparent to-[#09090B] pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,rgba(9,9,11,1)_85%)] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 w-full max-w-5xl px-8 mt-20 mb-20 flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-16">
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Breach Response
            </motion.h1>
            <motion.p variants={fadeUpB} className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
              Audit Mantle contracts, detect vulnerabilities, and run AI-powered incident tooling with human approval built in
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={reveal} className="relative mx-auto w-full max-w-4xl" style={{ perspective: '1000px' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-b from-[#10B981] to-transparent rounded-3xl opacity-30" />
            <motion.div
              className="relative bg-[#09090B]/95 border border-[#10B981]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              whileHover={{ scale: 1.008, borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 0 60px rgba(16,185,129,0.1)' }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/80 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="text-xs tracking-widest text-[#10B981] font-bold">NODE :: ONLINE</div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-black/60 border border-white/10 rounded-xl p-6 relative overflow-hidden group shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
                    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120%] h-[120%] max-w-none">
                      <circle cx="150" cy="150" r="40" stroke="#10B981" strokeWidth="1" strokeDasharray="2 4" />
                      <circle cx="150" cy="150" r="80" stroke="#10B981" strokeWidth="1" className="opacity-60" />
                      <circle cx="150" cy="150" r="120" stroke="#10B981" strokeWidth="1" strokeDasharray="5 5" className="opacity-40" />
                      <line x1="150" y1="10" x2="150" y2="290" stroke="#10B981" strokeWidth="0.5" className="opacity-30" />
                      <line x1="10" y1="150" x2="290" y2="150" stroke="#10B981" strokeWidth="0.5" className="opacity-30" />
                      <g className="origin-[150px_150px] animate-[spin_6s_linear_infinite]">
                        <line x1="150" y1="150" x2="270" y2="30" stroke="#10B981" strokeWidth="1.5" className="opacity-80" />
                        <polygon points="150,150 270,30 260,10" fill="url(#radar-sweep-gradient)" className="opacity-10 pointer-events-none" />
                      </g>
                      <circle cx="210" cy="110" r="3" fill="#10B981" className="opacity-80" />
                      <circle cx="90" cy="190" r="2.5" fill="#10B981" className="opacity-50" />
                      <circle cx="180" cy="220" r="3" fill="#10B981" className="opacity-40" />
                      <defs>
                        <linearGradient id="radar-sweep-gradient" x1="150" y1="150" x2="270" y2="30" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#10B981" stopOpacity="1" /><stop offset="1" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 font-mono text-[8px] text-gray-600 pointer-events-none select-none z-10 hidden sm:flex">
                    <span className="text-[7px] text-[#10B981] font-bold">138E</span>
                    <div className="w-1.5 h-32 bg-white/5 rounded relative border border-white/10 flex items-center justify-center">
                      <div className="absolute top-[30%] left-0 right-0 h-0.5 bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      {['5','4','3','2','1','0'].map((n, i) => (
                        <span key={n} className="absolute -left-3.5" style={{ top: i === 5 ? 'auto' : `${i * 20}%`, bottom: i === 5 ? 0 : 'auto' }}>{n}</span>
                      ))}
                    </div>
                    <span className="text-[6px] text-gray-500 uppercase tracking-widest mt-1">LVL</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs mb-3 text-[#10B981]">
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4 animate-pulse" /><span>MEMPOOL ACTIVE</span></div>
                    <div className="text-gray-500">Scanning pending blocks</div>
                  </div>
                  <div className="relative z-10 sm:pl-8">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg"><Target className="w-5 h-5 text-[#10B981]" /> Mempool Radar</h3>
                    <div className="space-y-4 font-mono text-sm">
                      <div className="text-gray-400 flex justify-between bg-white/5 p-2 rounded"><span>Tx: 0x8f2...9aa</span> <span className="text-[#10B981]">SAFE</span></div>
                      <div className="text-gray-400 flex justify-between bg-white/5 p-2 rounded"><span>Tx: 0x1b4...2cc</span> <span className="text-[#10B981]">SAFE</span></div>
                      <div className="text-yellow-500 flex justify-between bg-yellow-500/10 p-2 rounded animate-pulse border border-yellow-500/30"><span>Tx: 0x48c...eB7</span> <span>ANALYZING</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-xl p-6 flex flex-col justify-between shadow-inner">
                  <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-[#10B981]" /> Defense Matrix</h3>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed font-sans">
                      Mantle telemetry, LLM triage, operator approval, and GenLayer consensus checks turn suspicious activity into scoped response proposals.
                    </p>
                  </div>
                  <MagneticBtn
                    onClick={handleCommandCenterAccess}
                    className="w-full py-4 rounded-lg bg-[#10B981] text-black text-center font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:bg-white transition-all"
                  >
                    Enter Command Center
                  </MagneticBtn>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-40 z-30 bg-gradient-to-t from-[#050507] to-transparent pointer-events-none" />
      </div>

      {/* ─── Marquee ──────────────────────────────────────────────────────── */}
      <section className="py-6 border-y border-gray-900 bg-black/10 overflow-hidden relative z-40">
        <div className="flex whitespace-nowrap">
          <motion.div
            className="flex gap-16 pr-16 text-gray-500 font-bold tracking-widest text-sm uppercase shrink-0"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            style={{ willChange: 'transform' }}
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="flex items-center gap-2 shrink-0"><Hexagon className="w-4 h-4" /> Mantle Network</span>
                <span className="flex items-center gap-2 shrink-0"><Layers className="w-4 h-4" /> DeFi Protocols</span>
                <span className="flex items-center gap-2 shrink-0"><Component className="w-4 h-4" /> Smart Contracts</span>
                <span className="flex items-center gap-2 shrink-0"><Shield className="w-4 h-4" /> Enterprise Wallets</span>
                <span className="flex items-center gap-2 shrink-0"><Cpu className="w-4 h-4" /> AI DevTools</span>
                <span className="flex items-center gap-2 shrink-0"><Activity className="w-4 h-4" /> GenLayer Consensus</span>
                <span className="flex items-center gap-2 shrink-0"><ShieldCheck className="w-4 h-4" /> Security Tooling</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pipeline ─────────────────────────────────────────────────────── */}
      <section id={PIPELINE_EXECUTION_ANCHOR} className="scroll-mt-24 py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="text-center mb-16">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-6">Pipeline Execution</motion.h2>
          <motion.p variants={fadeUpB} className="text-gray-400 font-sans max-w-2xl mx-auto">
            A clear path from contract monitoring to human-approved response on Mantle
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start">
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-px border-t-2 border-dashed border-[#10B981]/20 -z-10" />
          {[
            {
              step: '01 / Monitor', title: 'Contract Watch',
              desc: 'Audit contracts for vulnerabilities, register sentinels, and watch Mantle RPC activity across protected protocols',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#10B981]"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" className="opacity-40" /><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="0.8" className="opacity-20" /><line x1="12" y1="12" x2="21" y2="7" stroke="currentColor" strokeWidth="1.2" className="origin-[12px_12px] animate-[spin_5s_linear_infinite]" /><circle cx="16" cy="15" r="1" fill="currentColor" /></svg>,
            },
            {
              step: '02 / Detect', title: 'AI Incident Triage',
              desc: 'Groq AI converts contract bytecode and on-chain anomalies into threat classifications with confidence scores',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#10B981]"><line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" /><line x1="18" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" /><line x1="6" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" /><line x1="18" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" /><circle cx="12" cy="12" r="3.5" fill="currentColor" className="animate-pulse" /><circle cx="6" cy="6" r="2" fill="currentColor" /><circle cx="18" cy="6" r="2" fill="currentColor" /><circle cx="6" cy="18" r="2" fill="currentColor" /><circle cx="18" cy="18" r="2" fill="currentColor" /></svg>,
            },
            {
              step: '03 / Approve', title: 'Human Gate',
              desc: 'Proposed calldata stays behind operator, multisig, or policy approval before any Mantle-side action',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#10B981]"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" className="opacity-30" /><path d="M 12 3 L 12 6" stroke="currentColor" strokeWidth="1.2" /><path d="M 12 18 L 12 21" stroke="currentColor" strokeWidth="1.2" /><path d="M 3 12 L 6 12" stroke="currentColor" strokeWidth="1.2" /><path d="M 18 12 L 21 12" stroke="currentColor" strokeWidth="1.2" /><rect x="9.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" className="origin-center animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" /></svg>,
            },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-[#18181B] border-2 border-[#10B981] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                {item.icon}
              </div>
              <span className="text-xs text-[#10B981] font-bold tracking-widest mb-2 block uppercase">{item.step}</span>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Live, AI-driven run of the pipeline above */}
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUpC} className="mt-16 max-w-3xl mx-auto">
          <LivePipeline />
        </motion.div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="mb-16">
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-6">Built for developers</motion.h2>
          <motion.p variants={fadeUpB} className="text-xl text-gray-400 max-w-2xl font-sans text-sm">
            Most tools stop at alerting. BreachResponse gives developers the audit scanner, gas estimator, and incident tooling to act before damage spreads.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Activity className="w-6 h-6" />, title: 'Runtime Monitoring', desc: 'Live Mantle Sepolia telemetry, contract bytecode analysis, and gas cost estimation in one developer console', meta: [['SCAN_RATE', 'Mantle RPC', false], ['APPROVAL', 'Operator gated', false]] },
            { icon: <Cpu className="w-6 h-6" />, title: 'AI Incident Triage', desc: 'Converts anomaly evidence into a threat class, confidence score, and scoped response proposal', meta: [['MODEL', 'Groq / Llama 3.1', true], ['GUARD', 'GenLayer consensus', true]] },
            { icon: <ShieldCheck className="w-6 h-6" />, title: 'Controlled Execution', desc: 'The Command Center routes approved actions to multisig or policy-controlled execution, with manual mode as the default', meta: [['APPROVAL', 'Manual first', false], ['POLICY', 'Allowlisted actions', true]] },
          ].map((card) => (
            <motion.div key={card.title} variants={fadeUp}>
              <motion.div
                className="p-8 rounded-2xl bg-[#09090B] border border-gray-800 cursor-default"
                whileHover={{ y: -8, scale: 1.02, borderColor: 'rgba(16,185,129,0.5)', boxShadow: '0 0 40px rgba(16,185,129,0.12)' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 border border-gray-800 text-[#10B981]">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-sans">{card.desc}</p>
              </motion.div>
              <div className="mt-8 pt-6 border-t border-gray-800/60 font-mono text-[10px] space-y-2 text-gray-500">
                {card.meta.map(([k, v, green]) => (
                  <div key={k as string} className="flex justify-between">
                    <span>{k}</span>
                    <span className={green ? 'text-[#10B981]' : 'text-gray-400'}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Dual-model consensus ─────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-5xl mx-auto relative z-40 border-t border-gray-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="text-center mb-12">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101014]/60 border border-gray-800/80 mb-4 text-xs font-bold text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            TWO MODELS, ONE VERDICT
          </motion.div>
          <motion.h2 variants={fadeUpB} className="text-3xl md:text-4xl font-bold text-white mb-4">AI Model Comparison</motion.h2>
          <motion.p variants={fadeUpC} className="text-gray-400 max-w-xl mx-auto font-sans text-sm">
            The same incident is classified by Groq (Llama 3.1) and Tencent Hunyuan in parallel. Agreement raises confidence; disagreement escalates to a human.
          </motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={reveal}>
          <ModelComparison />
        </motion.div>
      </section>

      {/* ─── Dev code ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-6">Developer first</motion.h2>
            <motion.p variants={fadeUpB} className="text-gray-400 mb-8 font-sans leading-relaxed text-sm">
              Run the local agent, connect a Mantle Sepolia wallet, register a protocol, and review response proposals from the Command Center. The public repo includes the contracts, frontend, agent, and deployment notes.
            </motion.p>
            <motion.div variants={stagger} className="space-y-4">
              {[
                'Full support for Python (Web3.py) and TypeScript (viem)',
                'Simple JSON configuration for custom alert endpoints',
                'Manual-first approval path for multisig and emergency pause guards',
              ].map((item) => (
                <motion.div key={item} variants={fadeUp} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                  <span className="text-sm text-gray-300 font-sans">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={reveal} className="bg-[#0C0C0E] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#141416] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setCodeTab('python')} className={`text-xs px-3 py-1.5 rounded font-mono font-bold transition-all duration-300 ${codeTab === 'python' ? 'bg-[#09090B] text-[#10B981] border border-gray-800' : 'text-gray-500 hover:text-white'}`}>sentinel.py</button>
                <button onClick={() => setCodeTab('typescript')} className={`text-xs px-3 py-1.5 rounded font-mono font-bold transition-all duration-300 ${codeTab === 'typescript' ? 'bg-[#09090B] text-[#10B981] border border-gray-800' : 'text-gray-500 hover:text-white'}`}>sentinel.ts</button>
              </div>
              <span className="text-[10px] text-gray-500 tracking-widest font-bold uppercase">REPO QUICK START</span>
            </div>
            <div className="p-6 overflow-x-auto text-xs font-mono min-h-[240px] leading-relaxed text-gray-300">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={codeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="space-y-1"
                >
                  {codeTab === 'python' ? (
                    <>
                      <div><span className="text-gray-500">{'# Start the local sentinel agent'}</span></div>
                      <div>{'cd agent'}</div><div>{'python -m venv .venv'}</div>
                      <div>{'source .venv/bin/activate'}</div><div>{'pip install -r requirements.txt'}</div>
                      <div>{'python main.py'}</div><br />
                      <div><span className="text-gray-500">{'# The agent scans Mantle RPC and streams structured incident events'}</span></div>
                    </>
                  ) : (
                    <>
                      <div><span className="text-gray-500">{'// Build and run the Command Center'}</span></div>
                      <div>{'cd frontend'}</div><div>{'npm ci'}</div>
                      <div>{'npm run build'}</div><div>{'npm run dev'}</div><br />
                      <div><span className="text-gray-500">{'// Open /dashboard to register guards and run incident review'}</span></div>
                    </>
                  )}
                </motion.pre>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Impact: before/after + gas savings ───────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40 border-t border-gray-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="text-center mb-12">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101014]/60 border border-gray-800/80 mb-4 text-xs font-bold text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            MEASURABLE IMPACT
          </motion.div>
          <motion.h2 variants={fadeUpB} className="text-3xl md:text-4xl font-bold text-white mb-4">What an automated pause is worth</motion.h2>
          <motion.p variants={fadeUpC} className="text-gray-400 max-w-xl mx-auto font-sans text-sm">
            The same reentrancy exploit, with and without BreachResponse watching — plus the gas burned chasing exploits that never landed.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={reveal} className="mb-8">
          <VaultBeforeAfter />
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUpC}>
          <GasSavingsCounter />
        </motion.div>
      </section>

      {/* ─── Ledger ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40 border-t border-gray-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="text-center mb-12">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101014]/60 border border-gray-800/80 mb-4 text-xs font-bold text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            LIVE MONITORING + RESPONSE REVIEW
          </motion.div>
          <motion.h2 variants={fadeUpB} className="text-3xl md:text-4xl font-bold text-white mb-4">Defense Matrix Ledger</motion.h2>
          <motion.p variants={fadeUpC} className="text-gray-400 max-w-xl mx-auto font-sans text-sm">
            Live Mantle block samples plus controlled response records for incident-review workflows.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={reveal} className="bg-[#101014]/40 backdrop-blur-md border border-gray-800/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#101014]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-400 tracking-wider font-bold">MANTLE BLOCK STREAM</span>
            <span className="text-xs text-[#10B981] font-bold">CONNECTED :: SEPOLIA RPC</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800/80 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Transaction</th><th className="px-6 py-4">Target Protocol</th>
                  <th className="px-6 py-4">Verification Type</th><th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Response Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors duration-300">
                    <td className="px-6 py-4 font-bold text-gray-300">{tx.txHash}</td>
                    <td className="px-6 py-4 text-gray-400">{tx.protocol}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-[#18181B] text-gray-300 font-medium">{tx.type}</span></td>
                    <td className="px-6 py-4">
                      {tx.status === 'SCANNING' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold animate-pulse">Scanning</span>}
                      {tx.status === 'PROPOSED' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold">Response ready</span>}
                      {tx.status === 'SAFE' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-gray-400 border border-white/10 font-bold">Clean</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#10B981] font-mono">
                      {tx.gasSaved && tx.gasSaved !== '0 mETH' && tx.gasSaved !== '0 MNT' ? tx.gasSaved : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-6xl mx-auto relative z-40 border-t border-gray-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="flex flex-col items-center text-center py-16">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Developer security tooling for Mantle
          </motion.h2>
          <motion.p variants={fadeUpB} className="text-base text-gray-400 max-w-xl mx-auto mb-10 font-sans leading-relaxed">
            Audit any Mantle contract, estimate gas costs, register sentinels, and keep response actions behind human approval.
          </motion.p>
          <motion.div variants={fadeUpC} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
            <WalletConnectControl
              disconnectedLabel="Enter Command Center"
              onBeforeConnect={beginCommandCenterLaunch}
              onConnectedClick={handleCommandCenterAccess}
              className="bg-[#10B981] text-black font-bold px-8 py-4 rounded text-sm hover:bg-green-400 transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] text-center font-mono flex items-center gap-2"
              connectedClassName="bg-[#10B981] text-black font-bold px-8 py-4 rounded text-sm hover:bg-green-400 transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] text-center font-mono flex items-center gap-2"
              connectedLabel="Enter Command Center"
            />
            <a href="https://docs.breachresponse.xyz" target="_blank" rel="noopener noreferrer" className="bg-black/50 border border-gray-800 hover:border-gray-700 text-white font-bold px-8 py-4 rounded text-sm transition-all duration-500 text-center font-mono">
              View Documentation
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-gray-800/40 py-16 px-8 md:px-16 relative z-40">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="BreachResponse Logo" width={24} height={24} className="object-contain" />
              <span className="text-lg font-bold tracking-widest text-white">BREACH RESPONSE</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-sans max-w-xs">
              AI-powered contract auditing, gas estimation, and incident response tooling for Mantle developers
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Networks</h4>
            <ul className="space-y-4 flex flex-col">
              <a href="https://www.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans">Mantle Network</a>
              <a href="https://sepolia.mantlescan.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans">Mantle Sepolia</a>
              <a href="https://faucet.sepolia.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans">Mantle Faucet</a>
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Links</h4>
            <ul className="space-y-4 flex flex-col">
              <a href="https://docs.breachresponse.xyz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="https://x.com/nousresearch" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X / Twitter
              </a>
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Agents</h4>
            <ul className="space-y-4 flex flex-col">
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans">Groq API</a>
              <a href="https://web3py.readthedocs.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors duration-500 text-sm font-sans">Web3.py</a>
            </ul>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-gray-800/40 text-center text-gray-600 text-xs font-sans">
          Built for the Turing Test Hackathon 2026 — AI DevTools Track
        </div>
      </footer>
    </main>
  );
}
