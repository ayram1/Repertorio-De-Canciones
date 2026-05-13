export const WA_PHONE = "5215555555555"; // Reemplazar con el número del local

export const getTableNumber = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('mesa') || params.get('Mesa');
};

export const buildWhatsAppLink = (song: string, artist: string, tableNumber: string | null): string => {
  let message = ``;
  if (tableNumber) {
    message += `Mesa ${tableNumber}\n`;
  } else {
    message += `Mesa [No especificada (escanear QR)]\n`;
  }
  message += `Canción: ${song}\nDe: ${artist}`;
  
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
};

// Funciones para manejar la cookie de tutorial (24 horas de caducidad)
export const hasSeenTutorial = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((item) => item.startsWith('lunas_tutorial_seen='));
};

export const setTutorialSeen = (): void => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  document.cookie = `lunas_tutorial_seen=true; expires=${date.toUTCString()}; path=/`;
};
