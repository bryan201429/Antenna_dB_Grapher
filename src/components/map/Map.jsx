import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  useMap,
  Polyline,
  Polygon,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

const scaleRadius = (dbm) => {
  return Math.max(1, Math.pow(10, (dbm + 100) / 25));
};

const isValidLatLng = ([lat, lng]) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

const MapComponent = ({
  latOrigenMap,
  lonOrigenMap,
  theta,
  potDbScal,
  coordState,
  maxDistance,
  latCsv,
  lonCsv,
}) => {
  const [radioDinamico, setRadioDinamico] = useState(0.7);

  useEffect(() => {
    if (maxDistance > 200) {
      setRadioDinamico(7);
    } else {
      setRadioDinamico(0.7);
    }
  }, [maxDistance]);

  // Validaciones básicas
  if (!Array.isArray(theta) || !Array.isArray(potDbScal)) {
    console.error("theta o potDbScal no son arrays válidos.");
    return <p>Error: datos inválidos.</p>;
  }

  // Unificar y validar longitud
  const minLength = Math.min(theta.length, potDbScal.length);
  const cleanedTheta = theta.slice(0, minLength);
  const cleanedPot = potDbScal.slice(0, minLength);
  const radii = cleanedPot.map(scaleRadius);
  const maxRadius = Math.max(...radii);

  // Calcular puntos
  let bluePoints = cleanedTheta.map((angle, index) => {
    const rad = (angle * Math.PI) / 180;
    const scaledRadius = (radii[index] / maxRadius) * maxDistance;

    const lat = latOrigenMap + (scaledRadius / 111111) * Math.sin(rad);
    const lon =
      lonOrigenMap +
      (scaledRadius / (111111 * Math.cos((latOrigenMap * Math.PI) / 180))) *
        Math.cos(rad);

    return [lat, lon];
  });

  // Validar coordenadas
  bluePoints = bluePoints.filter(isValidLatLng);

  if (bluePoints.length > 1) {
    bluePoints.push(bluePoints[0]);
  }

  // Si no hay puntos válidos, mostrar mensaje
  const noData = bluePoints.length <= 1;

  return (
    <MapContainer
      center={[latOrigenMap, lonOrigenMap]}
      zoom={19}
      style={{ height: "800px", width: "100%" }}
    >
      <MapUpdater center={[latOrigenMap, lonOrigenMap]} coordState={coordState} />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Mapa Normal">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={30}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satélite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, Maxar, Earthstar Geographics"
            maxZoom={30}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <CircleMarker
        center={[latOrigenMap, lonOrigenMap]}
        radius={7}
        color="red"
        fillOpacity={0.8}
      />

      {noData ? (
        <Tooltip
          permanent
          direction="top"
          offset={[0, -10]}
          position={[latOrigenMap, lonOrigenMap]}
        >
          <span>No hay datos válidos para graficar</span>
        </Tooltip>
      ) : (
        <>
          <Polyline positions={bluePoints} color="blue" />
          <Polygon
            positions={bluePoints}
            color="blue"
            fillColor="blue"
            fillOpacity={0.2}
          />

          {bluePoints.slice(0, -1).map((point, index) => (
            <Circle
              key={`blue-${index}`}
              center={point}
              radius={radioDinamico}
              color="blue"
              fillColor="blue"
              fillOpacity={0.5}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                <span>
                  N° {index + 1}
                  <br />
                  Pot: {Number(cleanedPot[index]).toFixed(5)} dBm
                </span>
              </Tooltip>
            </Circle>
          ))}
        </>
      )}

      {latCsv.map((lat, index) => {
        const lon = lonCsv[index];
        const point = [Number(lat), Number(lon)];
        if (!isValidLatLng(point)) return null;

        return (
          <Circle
            key={`green-${index}`}
            center={point}
            radius={radioDinamico}
            color="green"
            fillColor="green"
            fillOpacity={0.8}
            zIndexOffset={1000}
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              <span>
                N° {index + 1}
                <br />
                Lat: {point[0].toFixed(5)}
                <br />
                Lon: {point[1].toFixed(5)}
              </span>
            </Tooltip>
          </Circle>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
