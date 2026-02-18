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
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with ALL zoom/pan interactions explicitly enabled
    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true,
      zoomControl: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      tap: true,
    }).setView([lat, lng], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add initial circle
    circleRef.current = L.circle([lat, lng], {
      radius: radius,
      fillColor: '#FF6B35',
      fillOpacity: 0.2,
      color: '#FF6B35',
      weight: 2,
    }).addTo(map);

    // Fit bounds to show the circle with padding
    const bounds = circleRef.current.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      circleRef.current = null;
    };
  }, [lat, lng]);

  // Update circle radius when it changes and adjust view
  useEffect(() => {
    if (circleRef.current && mapInstanceRef.current) {
      circleRef.current.setRadius(radius);
      // Fit bounds to show the updated circle
      const bounds = circleRef.current.getBounds();
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20], animate: true });
    }
  }, [radius]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-48 rounded-lg overflow-hidden border border-border relative"
      style={{ 
        zIndex: 1,
        touchAction: 'auto', // Allow touch gestures for pinch-zoom
      }}
    />
  );
};

export default RadiusSliderMap;
