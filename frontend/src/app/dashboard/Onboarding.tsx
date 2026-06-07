'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Terminal, ShieldCheck, ChevronRight, X, Radio } from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

// Typewriter Effect Component
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const resetText = window.setTimeout(() => setDisplayedText(''), 0);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15); // Adjust speed here (ms per character)
    return () => {
      window.clearTimeout(resetText);
      clearInterval(interval);
    };
  }, [text]);

  return <span className="after:content-['█'] after:animate-pulse after:ml-1">{displayedText}</span>;
};

const ONBOARDING_STEPS = [
  {
    title: "System Initialization",
    icon: <Radio className="w-8 h-8 text-[#10B981] animate-pulse" />,
    description: "Welcome to the Breach Response Command Center This is your active defense matrix for monitoring and securing smart contracts on the Mantle network in real-time.",
    color: "from-[#10B981]/20 to-transparent",
    border: "border-[#10B981]/50",
    targetId: null,
    align: "center"
  },
  {
    title: "Deploy Sentinels",
    icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
    description: "Start by registering your smart contract addresses in the Deploy Sentinel Guard module. Once registered, our AI agents actively scan the mempool for malicious transactions targeting your protocol.",
    color: "from-blue-500/20 to-transparent",
    border: "border-blue-500/50",
    targetId: "ob-sentinel",
    align: "right"
  },
  {
    title: "Telemetry & Radar",
    icon: <Activity className="w-8 h-8 text-yellow-500" />,
    description: "The dashboard provides live network telemetry. Watch the oscilloscope for real-time traffic induction and track your monitored assets' latency and scan events on the radar grid.",
    color: "from-yellow-500/20 to-transparent",
    border: "border-yellow-500/50",
    targetId: "ob-telemetry",
    align: "right"
  },
  {
    title: "Live Threat Feed",
    icon: <Terminal className="w-8 h-8 text-red-500" />,
    description: "The sentinel agent logs findings directly to the Event Stream terminal. Critical incidents create scoped response proposals that stay operator-gated by default.",
    color: "from-red-500/20 to-transparent",
    border: "border-red-500/50",
    targetId: "ob-terminal",
    align: "left"
  }
];

export default function Onboarding({ isOpen, onClose }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Manage contextual highlighting of DOM elements
  useEffect(() => {
    if (!isOpen) return;

    // Clear all previous highlights
    ONBOARDING_STEPS.forEach(step => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.classList.remove('z-[101]', 'ring-2', 'ring-[#10B981]', 'shadow-[0_0_50px_rgba(16,185,129,0.3)]', 'scale-[1.02]');
        }
      }
    });

    // Apply new highlight
    const step = ONBOARDING_STEPS[currentStep];
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.classList.add('z-[101]', 'ring-2', 'ring-[#10B981]', 'shadow-[0_0_50px_rgba(16,185,129,0.3)]', 'scale-[1.02]');
      }
    }

    return () => {
      // Cleanup on unmount or close
      ONBOARDING_STEPS.forEach(step => {
        if (step.targetId) {
          const el = document.getElementById(step.targetId);
          if (el) {
            el.classList.remove('z-[101]', 'ring-2', 'ring-[#10B981]', 'shadow-[0_0_50px_rgba(16,185,129,0.3)]', 'scale-[1.02]');
          }
        }
      });
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      onClose();
      setTimeout(() => setCurrentStep(0), 500); 
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setTimeout(() => setCurrentStep(0), 500);
  };

  const stepData = ONBOARDING_STEPS[currentStep];
  
  // Determine alignment
  let alignClass = "items-center justify-center";
  if (stepData.align === "left") alignClass = "items-center justify-start pl-8 lg:pl-20";
  if (stepData.align === "right") alignClass = "items-center justify-end pr-8 lg:pr-20";

  return (
    <div className={`fixed inset-0 z-[100] flex ${alignClass} bg-black/80 backdrop-blur-sm p-4 transition-all duration-700`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`bg-[#0A0A0C] border ${stepData.border} rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative`}
      >
        {/* Dynamic Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${stepData.color} opacity-30 pointer-events-none transition-colors duration-500`} />
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2 relative z-10">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-white' : 'w-2 bg-gray-700'}`}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pt-6 relative z-10 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                {stepData.icon}
              </div>
              <h2 className="text-2xl font-bold mb-4 font-mono tracking-tight">{stepData.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm h-[80px]">
                <TypewriterText text={stepData.description} />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 relative z-10 flex justify-between items-center mt-2">
          <button 
            onClick={handleSkip}
            className="text-xs font-bold tracking-widest text-gray-500 hover:text-gray-300 uppercase transition-colors"
          >
            Skip Tour
          </button>
          
          <button 
            onClick={handleNext}
            className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? "Initialize Command Center" : "Next Module"} 
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
