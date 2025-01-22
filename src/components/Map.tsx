'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom monochrome map style
const MONOCHROME_MAP_STYLE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// Custom red marker icon
const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="#dc2626"/>
    <circle cx="12" cy="12" r="6" fill="#fbbf24"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

interface Location {
  lat: number;
  lng: number;
}

interface MapProps {
  onLocationSelect: (location: Location) => void;
  defaultLocation: Location;
  isDark?: boolean;
}

function LocationMarker({ onLocationSelect, defaultLocation }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([defaultLocation.lat, defaultLocation.lng]);
  const map = useMap();
  
  useEffect(() => {
    // Center map on default location on first load
    map.setView([defaultLocation.lat, defaultLocation.lng], map.getZoom());
  }, [map, defaultLocation]);

  useMapEvents({
    click(e) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return <Marker position={position} icon={customIcon} />;
}

export default function Map({ onLocationSelect, defaultLocation, isDark = false }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <span className="text-sm text-neutral-600">Loading map...</span>
      </div>
    );
  }

  // Monochrome map styles
  const LIGHT_MAP_STYLE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const DARK_MAP_STYLE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
          filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.2));
        }
        .custom-marker svg {
          transform-origin: bottom center;
          transition: transform 0.2s;
        }
        .custom-marker:hover svg {
          transform: scale(1.2);
        }
        /* Zoom control styles */
        .leaflet-control-zoom {
          border: none !important;
          margin: 12px !important;
        }
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
          color: #666 !important;
          background: white !important;
          border: 1px solid #e5e5e5 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
        .dark .leaflet-control-zoom-in,
        .dark .leaflet-control-zoom-out {
          background: #262626 !important;
          border-color: #404040 !important;
          color: #999 !important;
        }
        .leaflet-control-zoom-in {
          border-top-left-radius: 6px !important;
          border-top-right-radius: 6px !important;
        }
        .leaflet-control-zoom-out {
          border-bottom-left-radius: 6px !important;
          border-bottom-right-radius: 6px !important;
          border-top: none !important;
        }
        .leaflet-control-zoom-in:hover,
        .leaflet-control-zoom-out:hover {
          background: #f5f5f5 !important;
          color: #000 !important;
        }
        .dark .leaflet-control-zoom-in:hover,
        .dark .leaflet-control-zoom-out:hover {
          background: #404040 !important;
          color: #fff !important;
        }
      `}</style>
      <MapContainer
        center={[defaultLocation.lat, defaultLocation.lng]}
        zoom={4}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={MONOCHROME_MAP_STYLE}
          className={isDark ? 'brightness-[0.7] contrast-[1.2]' : ''}
        />
        <ZoomControl position="bottomright" />
        <LocationMarker onLocationSelect={onLocationSelect} defaultLocation={defaultLocation} />
        <MapController defaultLocation={defaultLocation} />
      </MapContainer>
    </>
  );
}

// Controller component to handle map initialization
function MapController({ defaultLocation }: { defaultLocation: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([defaultLocation.lat, defaultLocation.lng]);
  }, [map, defaultLocation]);

  return null;
} 