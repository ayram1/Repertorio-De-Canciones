import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';
import { setTutorialSeen } from '../lib/utils';

interface Step {
  targetId?: string;
  title: string;
  text: string;
  position?: 'top' | 'bottom' | 'center';
}

const steps: Step[] = [
  {
    title: "¡Bienvenido a Lunas de Café!",
    text: "En nuestro catálogo interactivo puedes elegir las canciones que quieres cantar. Te mostraremos cómo hacerlo.",
    position: 'center'
  },
  {
    targetId: 'search-tour',
    title: "Busca tu favorita",
    text: "Usa la barra de búsqueda para filtrar rápidamente por el nombre del artista o por el título de la canción.",
    position: 'bottom'
  },
  {
    targetId: 'song-list-tour',
    title: "Pídela al instante",
    text: "Toca cualquier canción y presiona 'Pedir Canción'. Tu pedido llegará directamente a nuestra cabina.",
    position: 'top'
  },
  {
    targetId: 'suggest-tour',
    title: "¿No encuentras tu canción?",
    text: "Si no está en el catálogo, usa este botón para sugerirla y enviarnos un mensaje por WhatsApp.",
    position: 'top'
  }
];

export default function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateRect = () => {
    const step = steps[currentStep];
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateRect();
    const step = steps[currentStep];
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTutorial();
    }
  };

  const finishTutorial = () => {
    setTutorialSeen();
    onComplete();
  };

  const step = steps[currentStep];
  
  let dialogStyle: React.CSSProperties = {};
  if (step.position === 'center') {
    dialogStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else if (targetRect) {
    if (step.position === 'bottom') {
      dialogStyle = { top: `${targetRect.bottom + 16}px`, left: '50%', transform: 'translateX(-50%)' };
    } else if (step.position === 'top') {
      dialogStyle = { bottom: `${window.innerHeight - targetRect.top + 16}px`, left: '50%', transform: 'translateX(-50%)' };
    }
  }

  const safeDialogStyle: React.CSSProperties = {
    ...dialogStyle,
    maxWidth: 'calc(100vw - 32px)',
    width: '320px'
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <div 
        className="absolute rounded-xl transition-all duration-500 ease-out pointer-events-auto"
        style={{
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          ...(targetRect ? {
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          } : {
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
          })
        }}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute pointer-events-auto"
            style={safeDialogStyle}
          >
            <div className="bg-neutral-900 border border-red-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative">
              {step.position === 'bottom' && targetRect && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-red-500/50" />
              )}
              {step.position === 'top' && targetRect && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-red-500/50" />
              )}
              
              <button 
                onClick={finishTutorial}
                className="absolute top-3 right-3 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-2 pr-6">{step.title}</h3>
              <p className="text-sm text-neutral-300 mb-6 leading-relaxed">{step.text}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-5 bg-red-500' : 'w-1.5 bg-neutral-700'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1"
                >
                  {currentStep === steps.length - 1 ? "¡Empezar!" : "Siguiente"}
                  {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
