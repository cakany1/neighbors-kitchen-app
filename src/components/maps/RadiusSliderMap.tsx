import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadiusSliderMapProps {
  lat: number;
  lng: number;
  radius: number;
}

const RadiusSliderMap = ({ lat, lng, radius }: RadiusSliderMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
      }).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add initial circle
      circleRef.current = L.circle([lat, lng], {
        radius: radius * 1000,
        fillColor: '#FF6B35',
        fillOpacity: 0.2,
        color: '#FF6B35',
        weight: 2,
      }).addTo(map);
    }

    // Update circle radius when it changes
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
  }, [lat, lng, radius]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-48 rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
};

export default RadiusSliderMap;
