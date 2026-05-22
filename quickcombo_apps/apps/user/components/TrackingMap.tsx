'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Premium Icons
const iconRider = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448601.png', // Delivery bike icon
  iconSize: [45, 45],
  iconAnchor: [22, 22],
  popupAnchor: [0, -20],
  className: 'rider-marker'
});

const iconHome = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png', // Modern home icon
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const iconShop = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3144/3144467.png', // Modern shop icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface TrackingMapProps {
  riderLat: number;
  riderLng: number;
  deliveryLat: number;
  deliveryLng: number;
  restaurantLat?: number;
  restaurantLng?: number;
}

// Map updater to smoothly pan to bounds
function MapUpdater({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1.5 });
  }, [map, bounds]);
  return null;
}

export default function TrackingMap({ riderLat, riderLng, deliveryLat, deliveryLng, restaurantLat, restaurantLng }: TrackingMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [animatedPos, setAnimatedPos] = useState<L.LatLngTuple>([riderLat, riderLng]);
  const prevPosRef = useRef<L.LatLngTuple>([riderLat, riderLng]);

  // Smooth Interpolation Logic
  useEffect(() => {
    const startPos = prevPosRef.current;
    const endPos: L.LatLngTuple = [riderLat, riderLng];
    
    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) return;

    let startTime: number | null = null;
    const duration = 2000; // 2 seconds for smooth slide

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        const lat = startPos[0] + (endPos[0] - startPos[0]) * progress;
        const lng = startPos[1] + (endPos[1] - startPos[1]) * progress;
        
        setAnimatedPos([lat, lng]);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            prevPosRef.current = endPos;
        }
    };
    
    requestAnimationFrame(animate);
  }, [riderLat, riderLng]);

  useEffect(() => {
    if (riderLat && riderLng && deliveryLat && deliveryLng) {
      const pts: L.LatLngTuple[] = [
        [riderLat, riderLng],
        [deliveryLat, deliveryLng]
      ];
      if (restaurantLat && restaurantLng) pts.push([restaurantLat, restaurantLng]);
      const b = new L.LatLngBounds(pts);
      setBounds(b);
    }
  }, [riderLat, riderLng, deliveryLat, deliveryLng, restaurantLat, restaurantLng]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_KEY || '';
  const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
  const attribution = 'Map data &copy; <a href="https://www.mapbox.com/">Mapbox</a>';

  if (!bounds) return null;

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        bounds={bounds} 
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#f8f8f8' }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        
        <Marker position={[deliveryLat, deliveryLng]} icon={iconHome} />
        
        {restaurantLat && restaurantLng && (
          <Marker position={[restaurantLat, restaurantLng]} icon={iconShop} />
        )}
        
        {/* Animated Rider Marker */}
        <Marker position={animatedPos} icon={iconRider}>
          <Popup className="qc-popup">Dinesh is here</Popup>
        </Marker>

        {/* Route Lines */}
        {restaurantLat && restaurantLng && (
          <>
            <Polyline 
              positions={[[restaurantLat, restaurantLng], [deliveryLat, deliveryLng]]} 
              pathOptions={{ color: '#27A152', weight: 4, dashArray: '10, 15', opacity: 0.2 }} 
            />
            <Polyline 
              positions={[[restaurantLat, restaurantLng], animatedPos]} 
              pathOptions={{ color: '#27A152', weight: 6, opacity: 0.8 }} 
            />
          </>
        )}
        
        <MapUpdater bounds={bounds} />
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-container { font-family: inherit; }
        .rider-marker {
            filter: drop-shadow(0 0 10px rgba(39, 161, 82, 0.4));
            transition: transform 0.2s linear;
        }
        .rider-marker:after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(39, 161, 82, 0.2);
            border-radius: 50%;
            animation: pulse-marker 2s infinite;
        }
        @keyframes pulse-marker {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
