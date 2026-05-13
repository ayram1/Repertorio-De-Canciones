import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Send } from 'lucide-react';
import { buildWhatsAppLink, WA_PHONE } from '../lib/utils';

interface SuggestSongProps {
  tableNumber: string | null;
}

export default function SuggestSong({ tableNumber }: SuggestSongProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!song.trim() || !artist.trim()) return;

    let message = '';
    if (tableNumber) {
      message += `Mesa ${tableNumber}\n`;
    }
    message += `¡Hola! Quiero sugerir esta canción para mi próxima visita:\n`;
    message += `Canción: ${song}\nArtista: ${artist}`;

    const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsOpen(false);
    setSong('');
    setArtist('');
  };

  return (
    <>
      <div className="fixed bottom-6 w-full px-4 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-red-500" />
          ¿No encuentras tu canción?
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-neutral-900 border border-red-500/30 rounded-2xl p-6 relative shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-2 pr-6">
                Sugiere una Canción
              </h2>
              <p className="text-neutral-400 text-sm mb-6">
                ¿No encontraste la canción que quieres cantar? Solicítala para que la agreguemos en tu próxima visita.
              </p>

              <form onSubmit={handleSuggest} className="space-y-4">
                <div>
                  <label htmlFor="song" className="block text-sm font-medium text-neutral-300 mb-1">
                    Nombre de la Canción
                  </label>
                  <input
                    id="song"
                    type="text"
                    required
                    value={song}
                    onChange={(e) => setSong(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    placeholder="Ej. El Triste"
                  />
                </div>

                <div>
                  <label htmlFor="artist" className="block text-sm font-medium text-neutral-300 mb-1">
                    Artista
                  </label>
                  <input
                    id="artist"
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    placeholder="Ej. José José"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    <Send className="w-4 h-4" />
                    Enviar a WhatsApp
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
