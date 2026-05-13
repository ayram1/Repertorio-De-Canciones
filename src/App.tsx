import React, { useState, useEffect } from 'react';
import { Search, Loader2, Music2 } from 'lucide-react';
import { ArtistData } from './types';
import { getTableNumber, hasSeenTutorial } from './lib/utils';
import SongList from './components/SongList';
import SuggestSong from './components/SuggestSong';
import Tutorial from './components/Tutorial';

// Fragmento de código (flag) para activar/desactivar la función de pedir canción
const ENABLE_SONG_REQUESTS = true;
const JSON_URL = 'https://raw.githubusercontent.com/ayram1/ayram1.github.io/main/repertorio.json';

export default function App() {
  const [data, setData] = useState<ArtistData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Inicializar número de mesa si existe en los parámetros (?mesa=7)
    setTableNumber(getTableNumber());

    // Mostrar tutorial solo si la cookie no indica que ya se vio
    if (!hasSeenTutorial()) {
      setShowTutorial(true);
    }

    // Funciones de carga
    const fetchData = async () => {
      try {
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error('Error al cargar el repertorio');
        const jsonData: ArtistData[] = await response.json();
        
        // Sorting alphabetically by artist name as an extra layer
        jsonData.sort((a, b) => a.artista.localeCompare(b.artista));
        setData(jsonData);
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-white">
      {/* Tutorial flotante (si aplica) */}
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}

      {/* Header Fijo */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-red-500/20 px-4 py-4 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music2 className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                Lunas <span className="text-red-500">De Café</span>
              </h1>
            </div>
            {tableNumber && (
              <div className="bg-red-950/30 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Mesa {tableNumber}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl leading-5 bg-transparent placeholder-neutral-500 focus:outline-none focus:bg-neutral-900 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all sm:text-sm"
              placeholder="Buscar por artista o canción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col flex-1 items-center justify-center p-12 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-red-500" />
            <p className="animate-pulse font-medium">Cargando repertorio...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-center">
            <p>{error}</p>
          </div>
        ) : (
          <SongList 
            data={data} 
            searchTerm={searchTerm} 
            tableNumber={tableNumber} 
            enableRequests={ENABLE_SONG_REQUESTS} 
          />
        )}
      </main>

      {/* Sugerencias Footer */}
      <SuggestSong tableNumber={tableNumber} />
    </div>
  );
}

