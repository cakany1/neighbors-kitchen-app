import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface FuzzyLocationMapProps {
  lat: number;
  lng: number;
  radius?: number;
  neighborhood?: string;
}

const FuzzyLocationMap = ({ lat, lng, radius = 200, neighborhood }: FuzzyLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], 15);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add circle to show fuzzy location
    L.circle([lat, lng], {
      radius: radius,
      fillColor: '#FF6B35',
      fillOpacity: 0.2,
      color: '#FF6B35',
      weight: 2,
    }).addTo(map).bindPopup(neighborhood || 'Ungefähre Umgebung / Neighborhood');

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, radius, neighborhood]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
};

export default FuzzyLocationMap;
