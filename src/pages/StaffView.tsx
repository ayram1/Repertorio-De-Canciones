import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Music2, RefreshCw, CheckCircle2, Ban, PlayCircle } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { fetchDashboardData, markSongAsPlayed, toggleSuspendTable, SongRequest } from '../lib/api';

interface Round {
  roundNumber: number;
  requests: SongRequest[];
}

export default function StaffView() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [suspendedTables, setSuspendedTables] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  
  // Guardamos las IDs conocidas para saber cuándo llega una nueva canción
  const knownIdsRef = useRef<Set<string>>(new Set());

  const loadData = async (isBackgroundPoll = false) => {
    try {
      if (!isBackgroundPoll) setLoading(true);
      const data = await fetchDashboardData();
      
      // Detectar nuevas
      if (isBackgroundPoll) {
        const newIds = data.requests.map(r => r.id);
        const hasNew = newIds.some(id => !knownIdsRef.current.has(id));
        if (hasNew) {
          toast.success('¡Nueva petición recibida!', {
            icon: '🎵',
            description: 'Se ha agregado una canción a la lista.'
          });
        }
      }

      setRequests(data.requests);
      setSuspendedTables(data.suspendedTables);
      
      // Actualizar IDs conocidas
      knownIdsRef.current = new Set(data.requests.map(r => r.id));
      setError(null);
      setLastFetchTime(new Date());
    } catch (err: any) {
      console.error(err);
      if (!isBackgroundPoll) setError(err.message || 'Error al cargar los datos en Google Sheets');
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Polling cada 15 segundos
    const interval = setInterval(() => loadData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Algoritmo Round Robin
  const rounds = useMemo(() => {
    const groupedByTable: Record<string, SongRequest[]> = {};
    
    // Agrupar por mesa, manteniendo el orden de llegada
    requests.forEach(req => {
      const mesaStr = String(req.mesa);
      if (!groupedByTable[mesaStr]) groupedByTable[mesaStr] = [];
      groupedByTable[mesaStr].push(req);
    });

    const calculatedRounds: Round[] = [];
    let roundIndex = 1;
    let hasMoreSongs = true;

    while (hasMoreSongs) {
      hasMoreSongs = false;
      const currentRound: SongRequest[] = [];
      
      // Iteramos a través de todas las mesas presentes
      Object.keys(groupedByTable).forEach(mesaStr => {
        // Obtenemos la primera canción disponible en la cola de esta mesa (si hay)
        if (groupedByTable[mesaStr].length > 0) {
          currentRound.push(groupedByTable[mesaStr].shift() as SongRequest);
          hasMoreSongs = true; // Todavía quedan canciones en esta mesa después de sacar esta? o en otras
        }
      });

      // Si sacamos al menos una canción de alguna mesa en esta vuelta, organizamos la ronda
      if (currentRound.length > 0) {
        // Ordenamos la ronda interna por timestamp para que, entre las mesas de esta ronda,
        // la que haya pedido primero en global, vaya primero
        currentRound.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        calculatedRounds.push({
          roundNumber: roundIndex,
          requests: currentRound
        });
        roundIndex++;
      }
    }

    return calculatedRounds;
  }, [requests]);


  const handleMarkPlayed = async (id: string, cancion: string) => {
    try {
      // Optimizamos la vista inmediatamente (optimistic update)
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(`"${cancion}" marcada como cantada`);
      
      await markSongAsPlayed(id);
      loadData(true);
    } catch (err) {
      toast.error('Error al actualizar canción');
      loadData(true); // Revertir progreso en caso de error
    }
  };

  const handleToggleSuspend = async (mesa: string | number) => {
    try {
      const isCurrentlySuspended = suspendedTables.includes(String(mesa));
      const newStatus = isCurrentlySuspended 
        ? suspendedTables.filter(m => String(m) !== String(mesa))
        : [...suspendedTables, String(mesa)];
      
      setSuspendedTables(newStatus); // Optimistic UI
      
      const isSuspended = await toggleSuspendTable(mesa);
      toast(isSuspended ? `Mesa ${mesa} suspendida` : `Mesa ${mesa} reactivada`, {
        icon: isSuspended ? '🚫' : '✅'
      });
      loadData(true);
    } catch (err) {
      toast.error('Ocurrió un error');
      loadData(true);
    }
  };

  // Obtener la lista de mesas activas (todas las mencionadas en requests) para poder silenciarlas fácilmente
  const activeTables = useMemo(() => {
    const list = new Set(requests.map(r => String(r.mesa)));
    suspendedTables.forEach(t => list.add(String(t))); // incluir las suspendidas también
    return Array.from(list);
  }, [requests, suspendedTables]);


  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-white">
      <Toaster theme="dark" position="top-right" richColors />
      
      {/* Header Fijo */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-red-500/20 px-4 py-4 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
              Panel DJ <span className="text-red-500">Lunas de Café</span>
            </h1>
          </div>
          
          <button 
            onClick={() => loadData()} 
            className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-red-500/50 hover:bg-neutral-800 transition-all text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : 'text-neutral-400'}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Columna Izquierda: Cola de Canciones */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-red-500" />
            Cola de Canciones
          </h2>

          {loading && rounds.length === 0 ? (
            <div className="flex flex-col flex-1 items-center justify-center p-12 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-red-500" />
              <p className="animate-pulse font-medium">Conectando con Google Sheets...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-center">
              <p>{error}</p>
            </div>
          ) : rounds.length === 0 ? (
            <div className="p-8 border border-dashed border-neutral-800 rounded-2xl text-center text-neutral-500 bg-neutral-900/20">
              <p>No hay canciones pendientes.</p>
              <p className="text-sm mt-2">¡Todo al día!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {rounds.map((round) => (
                <div key={round.roundNumber} className="relative">
                  <div className="flex items-center justify-between mb-4 sticky top-[72px] z-20 bg-black py-2">
                    <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>
                      Ronda {round.roundNumber}
                    </h3>
                    <div className="h-px bg-neutral-800 flex-1 ml-4 line-through"></div>
                  </div>

                  <div className="space-y-3">
                    {round.requests.map((req) => (
                      <div 
                        key={req.id} 
                        className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-red-500/30 transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-500 text-black text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                              Mesa {req.mesa}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {new Date(req.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="font-medium text-lg leading-tight text-white group-hover:text-red-100 transition-colors">
                            {req.cancion}
                          </p>
                          <p className="text-sm text-neutral-400">
                            {req.artista}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleMarkPlayed(req.id, req.cancion)}
                          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-green-600/20 hover:border-green-500 border border-transparent rounded-lg transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Marcar cantada</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Control de Mesas */}
        <div className="md:w-72 lg:w-80 flex-shrink-0">
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-5 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Control de Mesas</h2>
            <p className="text-xs text-neutral-500 mb-4 pb-4 border-b border-neutral-800">
              Suspende mesas temporalmente si están haciendo 'sobrepedidos' o abusos en la red.
            </p>

            <div className="space-y-2">
              {activeTables.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">No hay mesas activas actualmente.</p>
              ) : (
                activeTables.sort((a,b) => Number(a) - Number(b)).map(mesa => {
                  const isSuspended = suspendedTables.includes(String(mesa));
                  return (
                    <div key={mesa} className="flex items-center justify-between p-3 bg-black border border-neutral-800 rounded-xl">
                      <span className="font-medium">Mesa {mesa}</span>
                      <button
                        onClick={() => handleToggleSuspend(mesa)}
                        title={isSuspended ? "Reactivar pedidos" : "Suspender pedidos"}
                        className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                          isSuspended 
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                            : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
