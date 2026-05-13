import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Music, Phone, X, ChevronRight } from 'lucide-react';
import { setTutorialSeen } from '../lib/utils';

interface TutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: <Music className="w-12 h-12 text-red-500 mx-auto drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />,
    title: "¡Bienvenido a Lunas de Café!",
    text: "En nuestro catálogo interactivo puedes elegir las canciones que quieres escuchar. Es muy fácil, te mostramos cómo."
  },
  {
    icon: <Search className="w-12 h-12 text-red-500 mx-auto drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />,
    title: "Busca tu favorita",
    text: "Usa la barra de búsqueda para filtrar rápidamente por el nombre del artista o por el título de la canción."
  },
  {
    icon: <Phone className="w-12 h-12 text-red-500 mx-auto drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />,
    title: "Pídela al instante",
    text: "Toca cualquier canción y presiona 'Pedir Canción'. Te llevaremos directo a WhatsApp con tu mesa y canción listas para enviar."
  }
];

export default function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-neutral-900 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] rounded-2xl p-6 relative overflow-hidden"
      >
        <button 
          onClick={finishTutorial}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
          aria-label="Saltar tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mt-4 mb-6 text-center">
          {steps[currentStep].icon}
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          {steps[currentStep].title}
        </h2>
        
        <p className="text-neutral-300 text-center text-sm mb-8 min-h-[4rem]">
          {steps[currentStep].text}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-red-500 shadow-[0_0_5px_theme(colors.red.500)]' : 'w-2 bg-neutral-700'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-[0_0_10px_rgba(239,68,68,0.4)]"
          >
            {currentStep === steps.length - 1 ? "Comenzar" : "Siguiente"}
            {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        <button 
          onClick={finishTutorial}
          className="w-full text-center text-sm text-neutral-500 mt-6 hover:text-white underline decoration-neutral-700 hover:decoration-white transition-all focus:outline-none"
        >
          Saltar tutorial
        </button>
      </motion.div>
    </div>
  );
}
