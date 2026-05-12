'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface ManualMapProps {
  lat: number;
  lng: number;
  onSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onSelect }: ManualMapProps) {
  const [position, setPosition] = useState<L.LatLngExpression>([lat, lng]);
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onSelect(newPos.lat, newPos.lng);
        }
      },
    }),
    [onSelect],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={customIcon}
      ref={markerRef}
    />
  );
}

export default function ManualMap({ lat, lng, onSelect }: ManualMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_KEY || '';
  const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
  
  return (
    <div className="w-full h-full">
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={tileUrl} />
        <LocationMarker lat={lat} lng={lng} onSelect={onSelect} />
      </MapContainer>
      <style jsx global>{`
        .leaflet-container { background: #0a0a0a; }
      `}</style>
    </div>
  );
}
