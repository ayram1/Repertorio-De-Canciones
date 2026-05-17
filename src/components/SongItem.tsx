import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, MessageCircle, Loader2 } from 'lucide-react';
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
        toast.error('🎶 Disfruta la música en nuestro karaoke: este servicio es un regalo para quienes nos acompañan con su consumo. ¡Mientras más disfrutes, más canciones podrás pedir!', {
          duration: 8000,
        });
      } else {
        toast.error('Hubo un problema al pedir la canción. Intenta de nuevo.');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
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
  );
}
