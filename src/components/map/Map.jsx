import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap, Polyline } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

// 📌 Componente para actualizar el mapa cuando cambian los valores
const MapUpdater = ({ center, coordState }) => {
  const map = useMap();

  useEffect(() => {
    if (coordState && center) {
      map.setView(center, map.getZoom());
    }
  }, [center, coordState, map]);

  return null;
};

// 📌 Función para escalar la potencia en dBm a una escala logarítmica
const scaleRadius = (dbm) => {
  return Math.max(1, Math.pow(10, (dbm + 100) / 40)); // Evita radios negativos o muy pequeños
};

const MapComponent = ({ latOrigenMap, lonOrigenMap, theta, potDbScal, coordState, maxDistance, latCsv, lonCsv }) => {
  if (!potDbScal || potDbScal.length === 0) {
    console.error("potDbScal está vacío o no es válido:", potDbScal);
    return null;
  }

  // 1️⃣ Calcular radios escalados
  const radii = potDbScal.map(scaleRadius);
  const maxRadius = Math.max(...radii);
  
  // 2️⃣ Calcular coordenadas de los puntos azules
  const bluePoints = theta.map((angle, index) => {
    const radianAngle = (angle * Math.PI) / 180;
    const scaledRadius = (radii[index] / maxRadius) * maxDistance;

    const lat = latOrigenMap + (scaledRadius / 111111) * Math.sin(radianAngle);
    const lon = lonOrigenMap + (scaledRadius / (111111 * Math.cos((latOrigenMap * Math.PI) / 180))) * Math.cos(radianAngle);

    return [lat, lon];
  });

  // 3️⃣ Cerrar la trayectoria conectando el último punto con el primero
  if (bluePoints.length > 1) {
    bluePoints.push(bluePoints[0]);
  }

  return (
    <MapContainer center={[latOrigenMap, lonOrigenMap]} zoom={20} style={{ height: "100%", width: "100%" }}>
      <MapUpdater center={[latOrigenMap, lonOrigenMap]} coordState={coordState} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        maxZoom={40}
      />

      {/* 🔴 Punto central (Antena) */}
      <CircleMarker center={[latOrigenMap, lonOrigenMap]} radius={8} color="red" fillOpacity={0.8} />

      {/* 🔵 Dibujar puntos con escala normalizada */}
      {bluePoints.slice(0, -1).map((point, index) => (
        <Circle
          key={`blue-${index}`}
          center={point}
          radius={0.5}
          color="blue"
          fillColor="blue"
          fillOpacity={0.5}
        />
      ))}

      {/* 🔵 Dibujar la línea que conecta los puntos */}
      <Polyline positions={bluePoints} color="blue" weight={2} />

      {/* 🟢 Dibujar puntos de latCsv y lonCsv con color verde */}
      {latCsv.map((lat, index) => (
        <Circle
          key={`green-${index}`}
          center={[lat, lonCsv[index]]}
          radius={0.6}
          color="green"
          fillColor="green"
          fillOpacity={0.8}
        />
      ))}
    </MapContainer>
  );
};

export default MapComponent;
