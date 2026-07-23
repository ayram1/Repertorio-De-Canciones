import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Music2, RefreshCw, CheckCircle2, Ban, PlayCircle, Trash2, Settings, X, Lock } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { fetchDashboardData, markSongAsPlayed, toggleSuspendTable, clearTable, clearAllData, verifyPassword, updatePassword, SongRequest } from '../lib/api';

interface Round {
  roundNumber: number;
  requests: SongRequest[];
}

export default function StaffView() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('dj_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // App state
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [suspendedTables, setSuspendedTables] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [showGlow, setShowGlow] = useState(false);
  
  const knownIdsRef = useRef<Set<string>>(new Set());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const isValid = await verifyPassword(passwordInput);
      if (isValid) {
        sessionStorage.setItem('dj_auth', 'true');
        setIsAuthenticated(true);
      } else {
        toast.error('Contraseña incorrecta');
      }
    } catch (err) {
      toast.error('Ocurrió un error al verificar la contraseña');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await updatePassword(oldPwd, newPwd);
      toast.success('Contraseña actualizada correctamente');
      setOldPwd('');
      setNewPwd('');
      setShowSettings(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadData = async (isBackgroundPoll = false) => {
    if (!isAuthenticated) return;
    try {
      if (!isBackgroundPoll) setLoading(true);
      const data = await fetchDashboardData();
      
      if (isBackgroundPoll) {
        const newIds = data.requests.map(r => r.id);
        const hasNew = newIds.some(id => !knownIdsRef.current.has(id));
        if (hasNew) {
          toast.success('¡Nueva petición recibida!', {
            icon: '🎵',
            description: 'Se ha agregado una canción a la lista.'
          });
          setShowGlow(true);
        }
      }

      setRequests(data.requests);
      setSuspendedTables(data.suspendedTables);
      
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
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(() => loadData(true), 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const rounds = useMemo(() => {
    const groupedByTable: Record<string, SongRequest[]> = {};
    
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
      
      Object.keys(groupedByTable).forEach(mesaStr => {
        if (groupedByTable[mesaStr].length > 0) {
          currentRound.push(groupedByTable[mesaStr].shift() as SongRequest);
          hasMoreSongs = true;
        }
      });

      if (currentRound.length > 0) {
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
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(`"${cancion}" marcada como cantada`);
      
      await markSongAsPlayed(id);
      loadData(true);
    } catch (err) {
      toast.error('Error al actualizar canción');
      loadData(true);
    }
  };

  const handleToggleSuspend = async (mesa: string | number) => {
    try {
      const isCurrentlySuspended = suspendedTables.includes(String(mesa));
      const newStatus = isCurrentlySuspended 
        ? suspendedTables.filter(m => String(m) !== String(mesa))
        : [...suspendedTables, String(mesa)];
      
      setSuspendedTables(newStatus);
      
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

  const handleClearTable = async (mesa: string | number) => {
    if (!window.confirm(`¿Estás seguro de eliminar todas las canciones de la Mesa ${mesa}?`)) return;
    try {
      setRequests(prev => prev.filter(r => String(r.mesa) !== String(mesa)));
      toast.success(`Mesa ${mesa} vaciada correctamente`);
      await clearTable(mesa);
      loadData(true);
    } catch (err) {
      toast.error('Error al limpiar la mesa');
      loadData(true);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('¿ELIMINAR TODOS LOS DATOS? Esto vaciará todas las canciones y mesas suspendidas.')) return;
    try {
      setRequests([]);
      setSuspendedTables([]);
      toast.success('Todos los datos fueron borrados');
      await clearAllData();
      loadData(true);
    } catch (err) {
      toast.error('Error al borrar datos');
      loadData(true);
    }
  };

  const activeTables = useMemo(() => {
    const list = new Set(requests.map(r => String(r.mesa)));
    suspendedTables.forEach(t => list.add(String(t))); 
    return Array.from(list);
  }, [requests, suspendedTables]);


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-right" richColors />
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <Lock className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h1 className="text-xl font-bold">Acceso DJ</h1>
            <p className="text-neutral-500 text-sm">Introduce la contraseña para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              required
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-white">
      <Toaster theme="dark" position="top-right" richColors />
      
      {/* Glowing Notification Overlay */}
      {showGlow && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-24" style={{ boxShadow: 'inset 0 0 150px rgba(239, 68, 68, 0.4)' }}>
          <div className="absolute inset-0 animate-pulse bg-red-500/10 pointer-events-none border-4 border-red-500/50"></div>
          <button 
            onClick={() => setShowGlow(false)}
            className="pointer-events-auto bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:bg-red-500 transition-all flex items-center gap-2"
          >
            <Music2 className="w-5 h-5 animate-bounce" />
            ¡Nuevas canciones! (Click para enterado)
          </button>
        </div>
      )}

      {/* Header Fijo */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-red-500/20 px-4 py-4 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
              Panel DJ <span className="text-red-500">Lunas de Café</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClearAllData}
              title="Borrar todos los datos manualmente"
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-red-500 hover:bg-red-950/30 hover:border-red-500/50 transition-all font-medium"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 transition-all font-medium"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => loadData()} 
              className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-red-500/50 hover:bg-neutral-800 transition-all text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : 'text-neutral-400'}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Configuración</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">Contraseña Actual</label>
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 mt-2"
              >
                {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Columna Izquierda: Cola de Canciones */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-red-500" />
              Cola de Canciones
            </h2>
          </div>

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
              Administra el estado de cada mesa.
            </p>

            <div className="space-y-2">
              {activeTables.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">No hay mesas activas actualmente.</p>
              ) : (
                activeTables.sort((a,b) => Number(a) - Number(b)).map(mesa => {
                  const isSuspended = suspendedTables.includes(String(mesa));
                  return (
                    <div 
                      key={mesa} 
                      className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${
                        isSuspended ? 'bg-red-950/20 border-red-500/50' : 'bg-black border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSuspended ? 'text-red-400 line-through decoration-red-500/50' : ''}`}>
                          Mesa {mesa}
                        </span>
                        {isSuspended && <Ban className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleClearTable(mesa)}
                          title="Eliminar todas las canciones de la mesa"
                          className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-red-600/20 hover:text-red-500 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(mesa)}
                          title={isSuspended ? "Reactivar pedidos" : "Suspender pedidos"}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            isSuspended 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
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
