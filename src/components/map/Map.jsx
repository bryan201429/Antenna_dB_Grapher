import React, { useEffect,useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap, Polyline, Polygon, Tooltip, LayersControl, Rectangle } from "react-leaflet";
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

// Función para escalar la potencia en dBm a una escala logarítmica
const scaleRadius = (dbm) => {
  return Math.max(1, Math.pow(10, (dbm + 100) / 40)); 
};

const MapComponent = ({ latOrigenMap, lonOrigenMap, theta, potDbScal, coordState, maxDistance, latCsv, lonCsv }) => {
  if (!potDbScal || potDbScal.length === 0) {
    console.error("potDbScal está vacío o no es válido:", potDbScal);
    return null;
  }
  const [radioDinamico, setRadioDinamico] = useState(0.7);
  useEffect(() => {
    if (maxDistance > 200) {
      setRadioDinamico(7);
    } else {
      setRadioDinamico(0.7);
    }
  }, [maxDistance]);
  // Calcular radios escalados
  const radii = potDbScal.map(scaleRadius);
  const maxRadius = Math.max(...radii);

  // Calcular coordenadas de los puntos azules
  const bluePoints = theta.map((angle, index) => {
    const radianAngle = (angle * Math.PI) / 180;
    const scaledRadius = (radii[index] / maxRadius) * maxDistance;

    const lat = latOrigenMap + (scaledRadius / 111111) * Math.sin(radianAngle);
    const lon = lonOrigenMap + (scaledRadius / (111111 * Math.cos((latOrigenMap * Math.PI) / 180))) * Math.cos(radianAngle);

    return [lat, lon];
  });

  // Cerrar la trayectoria conectando el último punto con el primero
  if (bluePoints.length > 1) {
    bluePoints.push(bluePoints[0]);
  }

  return (
    <MapContainer center={[latOrigenMap, lonOrigenMap]} zoom={19}  style={{ height: "800px", width: "100%" }}>
      <MapUpdater center={[latOrigenMap, lonOrigenMap]} coordState={coordState} />
      <LayersControl position="topright">
  <LayersControl.BaseLayer checked name="Mapa Normal">
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; OpenStreetMap contributors'
      maxZoom={30} // ⬅️ Aumenta el nivel de zoom
    />
  </LayersControl.BaseLayer>
  
  <LayersControl.BaseLayer name="Satélite">
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      attribution='&copy; Esri, Maxar, Earthstar Geographics'
      maxZoom={30} // ⬅️ Aumenta el nivel de zoom
    />
  </LayersControl.BaseLayer>
</LayersControl>

      {/* 🔴 Punto origen señal (Antena) */}
      <CircleMarker center={[latOrigenMap, lonOrigenMap]} radius={7} color="red" fillOpacity={0.8} />

      {/* 🔵 Dibujar la línea que conecta los puntos */}
      <Polyline positions={[...bluePoints, bluePoints[0]]} color="blue" />
          <Polygon positions={bluePoints} color="blue" fillColor="blue" fillOpacity={0.2} />
      {/* 🔵 Puntos con escala normalizada */}
      {bluePoints.slice(0, -1).map((point, index) => (
        <Circle key={`blue-${index}`} center={point} radius={radioDinamico} color="blue" fillColor="blue" fillOpacity={0.5}>
        <Tooltip direction="top" offset={[0, -5]} opacity={1} >
          <span>N° {index + 1} <br /> Pot: {Number(potDbScal[index]).toFixed(5)} dBm</span>
        </Tooltip>
      </Circle>
      ))}



      {/* 🟢 Dibujar puntos de latCsv y lonCsv con color verde */}
      {latCsv.map((lat, index) => (
          <Circle key={`green-${index}`} center={[Number(lat), Number(lonCsv[index])]} radius={radioDinamico} color="green" fillColor="green" fillOpacity={0.8} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -5]} opacity={1} >
            <span>N° {index + 1}<br />Lat: {Number(lat).toFixed(5)}<br />Lon: {Number(lonCsv[index]).toFixed(5)}</span>
          </Tooltip>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
