import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

const MapUpdater = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

const scaleRadius = (dbm) => {
  return Math.max(1, Math.pow(10, (dbm + 100) / 40)); // Evita radios negativos o muy pequeños
};



const MapComponent = ({ latOrigen, lonOrigen, theta, potDbScal }) => {
  return (
    <MapContainer center={[latOrigen, lonOrigen]} zoom={18} style={{ height: "100%", width: "100%" }}>
      <MapUpdater center={[latOrigen, lonOrigen]} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🔴 Punto central (Antena) */}
      <CircleMarker center={[latOrigen, lonOrigen]} radius={8} color="red" fillOpacity={0.8} />

      {/* 🔵 Dibujar puntos basados en ángulos y potencias */}
      {theta.map((angle, index) => {
        const radianAngle = (angle * Math.PI) / 180; // Convertir ángulo a radianes
        const radius = scaleRadius(potDbScal[index])*1; // Escalar potencia en radio

        // 📌 Convertir (ángulo, radio) a desplazamiento en lat/lng
        const lat = latOrigen + (radius / 111111) * Math.sin(radianAngle);
        const lon = lonOrigen + (radius / (111111 * Math.cos((latOrigen * Math.PI) / 180))) * Math.cos(radianAngle);

        return (
          <Circle
            key={index}
            center={[lat, lon]}
            radius={2} // Fijar radio del marcador
            color="blue"
            fillColor="blue"
            fillOpacity={0.5}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
