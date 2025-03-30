import React from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
// 📍 Punto central (Antena)
const lat0 = -16.409777;
const lng0 = -71.528251;

// 📡 Datos normalizados (Angulo en grados, Radio en metros)
const data = [
  { angle: 0, radius: 50 },
  { angle: 45, radius: 80 },
  { angle: 90, radius: 70 },
  { angle: 135, radius: 90 },
  { angle: 180, radius: 60 },
  { angle: 225, radius: 50 },
  { angle: 270, radius: 75 },
  { angle: 315, radius: 85 },
  { angle: 360, radius: 50 }, // Cerrar el círculo
];

// 📌 Convertir (ángulo, radio) → (lat, lng)
const processedPoints = data.map(({ angle, radius }) => {
  const radianAngle = (angle * Math.PI) / 180; // Convertir grados a radianes

  // Convertir radio en desplazamiento en lat/lng
  const newLat = lat0 + (radius / 111111) * Math.sin(radianAngle);
  const newLng = lng0 + (radius / (111111 * Math.cos((lat0 * Math.PI) / 180))) * Math.cos(radianAngle);

  return { lat: newLat, lng: newLng };
});

const MapComponent = () => {
  return (
    <MapContainer center={[lat0, lng0]} zoom={18} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🔴 Punto central (Antena) */}
      <CircleMarker center={[lat0, lng0]} radius={8} color="red" fillOpacity={0.8} />

      {/* 🔵 Puntos del diagrama polar */}
      {processedPoints.map((point, index) => (
        <CircleMarker key={index} center={[point.lat, point.lng]} radius={5} color="blue" fillOpacity={0.8} />
      ))}

      {/* 🔷 Línea conectando los puntos */}
      <Polyline positions={processedPoints} color="blue" weight={2} />
    </MapContainer>
  );
};

export default MapComponent;