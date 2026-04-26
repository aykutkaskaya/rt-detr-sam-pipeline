import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Cpu, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  status: 'initializing' | 'loading_weights' | 'starting_cuda' | 'ready' | 'error';
  error?: string | null;
}

export function LoadingOverlay({ isVisible, status, error }: LoadingOverlayProps) {
  const steps = [
    { id: 'initializing', label: 'Initializing Environment', icon: Cpu },
    { id: 'loading_weights', label: 'Loading AI Model Weights', icon: Database },
    { id: 'starting_cuda', label: 'Warming up GPU / CUDA', icon: Brain },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);
  const isReady = status === 'ready';
  const isError = status === 'error';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-md"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative w-full max-w-md p-8 flex flex-col items-center text-center">
            <motion.div
              animate={isError ? {} : { y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] border border-white/10 flex items-center justify-center shadow-2xl">
                {isError ? (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                ) : isReady ? (
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                ) : (
                  <Brain className="w-10 h-10 text-accent animate-pulse" />
                )}
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold mb-2 tracking-tight text-white">
              {isError ? 'Initialization Failed' : isReady ? 'AI Engine Ready' : 'NeuroScan AI Initializing'}
            </h1>
            <p className="text-sm text-muted mb-10 max-w-[280px]">
              {isError
                ? 'There was an error starting the AI engine. Please check your backend logs.'
                : isReady
                  ? 'All models are loaded and optimized for inference.'
                  : 'Please wait while we prepare the RT-DETR and SAM models on your GPU.'}
            </p>

            {!isError && !isReady && (
              <div className="w-full space-y-4 text-left">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl border transition-all duration-500",
                        isActive ? "bg-white/5 border-accent/30 shadow-[0_0_20px_rgba(0,255,136,0.05)]" : "border-transparent opacity-40"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isCompleted ? "bg-accent/20 text-accent" : isActive ? "bg-accent text-black" : "bg-white/5 text-muted"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className={cn("w-5 h-5", isActive && "animate-pulse")} />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-xs font-semibold", isActive ? "text-white" : "text-muted")}>
                          {step.label}
                        </p>
                      </div>
                      {isActive && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                    </div>
                  );
                })}
              </div>
            )}

            {isError && (
              <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-left overflow-auto max-h-32">
                {error}
              </div>
            )}

            {isError && (
              <button
                onClick={() => window.location.reload()}
                className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all"
              >
                Retry Initialization
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
