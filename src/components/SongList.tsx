import React, { useMemo } from 'react';
import { ArtistData } from '../types';
import SongItem from './SongItem';

interface SongListProps {
  data: ArtistData[];
  searchTerm: string;
  tableNumber: string | null;
  enableRequests?: boolean;
}

export default function SongList({ data, searchTerm, tableNumber, enableRequests = true }: SongListProps) {
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data;

    return data.map(artist => {
      // Check if artist name matches
      if (artist.artista.toLowerCase().includes(term)) {
        return artist; // Return all songs for this artist
      }
      
      // Otherwise filter songs
      const matchingSongs = artist.canciones.filter(song => 
        song.toLowerCase().includes(term)
      );

      if (matchingSongs.length > 0) {
        return { ...artist, canciones: matchingSongs };
      }
      
      return null;
    }).filter(Boolean) as ArtistData[];
  }, [data, searchTerm]);

  if (filteredData.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-500">
        <p>No encontramos resultados para "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {filteredData.map((artistData, index) => (
        <div key={index} className="mb-8">
          <h2 className="sticky top-0 z-10 bg-black/90 backdrop-blur-md py-3 text-lg font-bold text-red-500 border-b border-red-500/20 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            {artistData.artista}
          </h2>
          <div className="flex flex-col">
            {artistData.canciones.map((song, songIndex) => (
              <SongItem 
                key={`${artistData.artista}-${songIndex}`}
                song={song}
                artist={artistData.artista}
                tableNumber={tableNumber}
                enableRequests={enableRequests}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
