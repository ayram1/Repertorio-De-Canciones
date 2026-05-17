export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz74hF0rfjB3VfZzGalVyKYkzp-e6aymAbRIuxvp19mOt58_Ak6-TWDx9JgKJl5SxBnig/exec'; // <-- IMPORTANTE: Pega aquí la URL de tu Web App

export interface SongRequest {
  id: string;
  timestamp: string;
  mesa: string | number;
  cancion: string;
  artista: string;
  played: boolean | string;
}

export interface SheetsResponse {
  requests: SongRequest[];
  suspendedTables: (string | number)[];
}

export const fetchDashboardData = async (): Promise<SheetsResponse> => {
  if (GOOGLE_SCRIPT_URL === 'Pega aquí la URL de tu Web App') {
    return { requests: [], suspendedTables: [] }; // Mock if empty
  }
  
  const response = await fetch(GOOGLE_SCRIPT_URL);
  if (!response.ok) throw new Error("Error fetching data");
  return response.json();
};

export const addSongRequest = async (mesa: string, cancion: string, artista: string) => {
  if (GOOGLE_SCRIPT_URL === 'Pega aquí la URL de tu Web App') {
    throw new Error("URL de Google Sheets no configurada");
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    // Usamos text/plain para evitar problemas de CORS de preflight (OPTIONS)
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ cmd: 'add_request', mesa, cancion, artista })
  });
  
  const data = await response.json();
  if (!data.success) {
    if (data.error === 'suspended') {
      throw new Error("suspended");
    }
    throw new Error(data.error || "Error al solicitar la canción");
  }
  return data;
};

export const markSongAsPlayed = async (id: string) => {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ cmd: 'mark_played', id })
  });
  const data = await response.json();
  if (!data.success) throw new Error("Error al actualizar la canción");
  return data;
};

export const toggleSuspendTable = async (mesa: string | number) => {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ cmd: 'toggle_suspend', mesa })
  });
  const data = await response.json();
  if (!data.success) throw new Error("Error al modificar estado de la mesa");
  return data.suspended; // true o false
};
