import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, MessageCircle, Loader2, Info } from 'lucide-react';
import { addSongRequest } from '../lib/api';
import { toast } from 'sonner';

interface SongItemProps {
  song: string;
  artist: string;
  tableNumber: string | null;
  enableRequests?: boolean; // Flag to easily toggle the feature
}

export default function SongItem({ song, artist, tableNumber, enableRequests = true }: SongItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);

  const handleRequest = async () => {
    if (!tableNumber) {
      toast.error('Número de mesa no encontrado. Por favor, escanea el código QR de nuevo.');
      return;
    }

    setIsRequesting(true);
    try {
      await addSongRequest(tableNumber, song, artist);
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">¡Canción pedida!</span>
          <span className="text-sm opacity-90">Pronto sonará "{song}" de {artist}</span>
        </div>
      );
      setExpanded(false);
    } catch (err: any) {
      if (err.message === 'suspended') {
        setShowSuspendedModal(true);
      } else {
        toast.error('Hubo un problema al pedir la canción. Intenta de nuevo.');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      <div className="border-b border-neutral-800/50 last:border-0 relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left py-4 px-2 hover:bg-neutral-900/50 transition-colors flex items-center justify-between group focus:outline-none"
        >
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-white font-medium group-hover:text-red-400 transition-colors">
              {song}
            </span>
            <span className="text-neutral-500 text-sm">
              {artist}
            </span>
          </div>
          <Music className="w-5 h-5 text-neutral-600 group-hover:text-red-500 transition-colors flex-shrink-0" />
        </button>

        <AnimatePresence>
          {expanded && enableRequests && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-4 pt-1 px-2">
                <button
                  onClick={handleRequest}
                  disabled={isRequesting}
                  className="flex items-center justify-center gap-2 w-full bg-neutral-900 text-white border border-red-500/50 hover:bg-red-950/40 py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequesting ? (
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-semibold text-sm">
                    {isRequesting ? 'Enviando...' : 'Pedir Canción'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSuspendedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] rounded-2xl p-6 max-w-sm w-full relative z-50 text-center"
            >
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¡Sigue disfrutando!</h3>
              <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
                🎶 Disfruta la música en nuestro karaoke: este servicio es un regalo para quienes nos acompañan con su consumo. ¡Mientras más disfrutes, más canciones podrás pedir!
              </p>
              <button
                onClick={() => setShowSuspendedModal(false)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
