import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, MessageCircle } from 'lucide-react';
import { buildWhatsAppLink } from '../lib/utils';

interface SongItemProps {
  song: string;
  artist: string;
  tableNumber: string | null;
  enableRequests?: boolean; // Flag to easily toggle the feature
}

export default function SongItem({ song, artist, tableNumber, enableRequests = true }: SongItemProps) {
  const [expanded, setExpanded] = useState(false);

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
              <a
                href={buildWhatsAppLink(song, artist, tableNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-neutral-900 text-white border border-red-500/50 hover:bg-red-950/40 py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:border-red-500"
              >
                <MessageCircle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-sm">Pedir Canción</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
