import React, { useRef, useEffect, useState } from "react";
import Gradient from "javascript-color-gradient";
import mapboxgl from "mapbox-gl";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/Map.module.css";
import Sidebar from "./Sidebar";
import ToggleLayersControl from "./ToggleLayersControl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const colorGradient = new Gradient();
colorGradient.setGradient(
  "#0000FF",
  "#00FF00",
  "#FFFF00",
  "#FFA500",
  "#FF0000"
);
colorGradient.setMidpoint(360);

const jsonFetcher = (url: string) => fetch(url).then((res) => res.json());

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;
  const map = useRef<mapboxgl.Map | null>(
    null
  ) as React.MutableRefObject<mapboxgl.Map>;
  const mapWrapper = useRef<HTMLDivElement | null>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );

  const { data, error } = useSWRImmutable(
    "https://cells.modmapper.com/edits.json",
    jsonFetcher
  );

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: ["https://tiles.modmapper.com/{z}/{x}/{y}.jpg"],
            tileSize: 256,
            attribution:
              'Map tiles by <a href="https://en.uesp.net/wiki/Skyrim:Skyrim">UESP</a>',
          },
        },
        layers: [
          {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
          },
        ],
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      },
      center: [0, 0],
      zoom: 0,
      minZoom: 0,
      maxZoom: 8,
      maxBounds: [
        [-180, -85.051129],
        [180, 85.051129],
      ],
    });
  });

  useEffect(() => {
    if (!data) return; // wait for map to initialize and data to load
    map.current.on("load", () => {
      const zoom = map.current.getZoom();
      const viewportNW = map.current.project([-180, 85.051129]);
      const cellSize = Math.pow(2, zoom + 2);

      const graticule: GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        GeoJSON.GeoJsonProperties
      > = {
        type: "FeatureCollection",
        features: [],
      };
      for (let x = 0; x < 128; x += 1) {
        let lng = map.current.unproject([x * cellSize + viewportNW.x, -90]).lng;
        graticule.features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lng, -90],
              [lng, 90],
            ],
          },
          properties: { value: x },
        });
      }
      for (let y = 0; y < 128; y += 1) {
        let lat = map.current.unproject([
          -180,
          y * cellSize + viewportNW.y,
        ]).lat;
        graticule.features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [-180, lat],
              [180, lat],
            ],
          },
          properties: { value: y },
        });
      }

      map.current.addSource("graticule", {
        type: "geojson",
        data: graticule,
      });

      map.current.addLayer({
        id: "graticule",
        type: "line",
        source: "graticule",
      });

      const gridLabelPoints: GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        GeoJSON.GeoJsonProperties
      > = {
        type: "FeatureCollection",
        features: [],
      };
      for (let x = 0; x < 128; x += 1) {
        for (let y = 0; y < 128; y += 1) {
          let nw = map.current.unproject([
            x * cellSize + viewportNW.x + cellSize / 32,
            y * cellSize + viewportNW.y + cellSize / 32,
          ]);
          gridLabelPoints.features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [nw.lng, nw.lat],
            },
            properties: {
              label: `${x - 57}, ${50 - y}`,
            },
          });
        }
      }
      map.current.addSource("grid-labels-source", {
        type: "geojson",
        data: gridLabelPoints,
      });

      map.current.addLayer({
        id: "grid-labels-layer",
        type: "symbol",
        source: "grid-labels-source",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 0],
          "text-anchor": "top-left",
          "text-rotation-alignment": "map",
        },
        paint: {
          "text-halo-width": 1,
          "text-halo-blur": 3,
          "text-halo-color": "rgba(255,255,255,0.8)",
        },
        minzoom: 4,
      });

      const grid: GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        GeoJSON.GeoJsonProperties
      > = {
        type: "FeatureCollection",
        features: [],
      };
      for (let x = 0; x < 128; x += 1) {
        for (let y = 0; y < 128; y += 1) {
          let nw = map.current.unproject([
            x * cellSize + viewportNW.x,
            y * cellSize + viewportNW.y,
          ]);
          let ne = map.current.unproject([
            x * cellSize + viewportNW.x + cellSize,
            y * cellSize + viewportNW.y,
          ]);
          let se = map.current.unproject([
            x * cellSize + viewportNW.x + cellSize,
            y * cellSize + viewportNW.y + cellSize,
          ]);
          let sw = map.current.unproject([
            x * cellSize + viewportNW.x,
            y * cellSize + viewportNW.y + cellSize,
          ]);
          const editCount = (data as Record<string, number>)[
            `${x - 57},${50 - y}`
          ];
          grid.features.push({
            type: "Feature",
            id: x * 100 + y,
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [nw.lng, nw.lat],
                  [ne.lng, ne.lat],
                  [se.lng, se.lat],
                  [sw.lng, sw.lat],
                  [nw.lng, nw.lat],
                ],
              ],
            },
            properties: {
              x: x,
              y: y,
              cellX: x - 57,
              cellY: 50 - y,
              label: `${x - 57}, ${50 - y}`,
              color: editCount ? colorGradient.getColor(editCount) : "#888888",
              opacity: editCount ? Math.min((editCount / 150) * 0.25, 0.5) : 0,
            },
          });
        }
      }

      map.current.addSource("grid-source", {
        type: "geojson",
        data: grid,
      });

      map.current.addLayer(
        {
          id: "grid-layer",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-opacity": 0,
          },
        },
        "grid-labels-layer"
      );

      map.current.addLayer(
        {
          id: "heatmap-layer",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": ["get", "opacity"],
            "fill-outline-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "white",
              "transparent",
            ],
          },
        },
        "grid-labels-layer"
      );
      const fullscreenControl = new mapboxgl.FullscreenControl();
      console.log(
        (fullscreenControl as unknown as { _container: HTMLElement })._container
      );
      (fullscreenControl as unknown as { _container: HTMLElement })._container =
        mapWrapper.current;
      console.log(
        (fullscreenControl as unknown as { _container: HTMLElement })._container
      );
      map.current.addControl(fullscreenControl);
      map.current.addControl(new mapboxgl.NavigationControl());

      let singleClickTimeout: NodeJS.Timeout | null = null;
      map.current.on("click", "grid-layer", (e) => {
        console.log("click");
        const features = e.features;
        if (singleClickTimeout) return;
        singleClickTimeout = setTimeout(() => {
          singleClickTimeout = null;
          if (features && features[0]) {
            console.log("timeout");
            const cell: [number, number] = [
              features[0].properties!.cellX,
              features[0].properties!.cellY,
            ];
            map.current.removeFeatureState({ source: "grid-source" });
            map.current.setFeatureState(
              {
                source: "grid-source",
                id: features[0].id,
              },
              {
                selected: true,
              }
            );
            setSelectedCell(cell);
            map.current.resize();

            var zoom = map.current.getZoom();
            var viewportNW = map.current.project([-180, 85.051129]);
            var cellSize = Math.pow(2, zoom + 2);
            const x = features[0].properties!.x;
            const y = features[0].properties!.y;
            let nw = map.current.unproject([
              x * cellSize + viewportNW.x,
              y * cellSize + viewportNW.y,
            ]);
            let ne = map.current.unproject([
              x * cellSize + viewportNW.x + cellSize,
              y * cellSize + viewportNW.y,
            ]);
            let se = map.current.unproject([
              x * cellSize + viewportNW.x + cellSize,
              y * cellSize + viewportNW.y + cellSize,
            ]);
            let sw = map.current.unproject([
              x * cellSize + viewportNW.x,
              y * cellSize + viewportNW.y + cellSize,
            ]);
            const selectedCellLines: GeoJSON.FeatureCollection<
              GeoJSON.Geometry,
              GeoJSON.GeoJsonProperties
            > = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [nw.lng, nw.lat],
                      [ne.lng, ne.lat],
                      [se.lng, se.lat],
                      [sw.lng, sw.lat],
                      [nw.lng, nw.lat],
                    ],
                  },
                  properties: { x: x, y: y },
                },
              ],
            };

            if (map.current.getLayer("selected-cell-layer")) {
              map.current.removeLayer("selected-cell-layer");
            }
            if (map.current.getSource("selected-cell-source")) {
              map.current.removeSource("selected-cell-source");
            }
            map.current.addSource("selected-cell-source", {
              type: "geojson",
              data: selectedCellLines,
            });
            map.current.addLayer({
              id: "selected-cell-layer",
              type: "line",
              source: "selected-cell-source",
              paint: {
                "line-color": "blue",
                "line-width": 3,
              },
            });

            const bounds = map.current.getBounds();
            if (!bounds.contains(nw) || !bounds.contains(se)) {
              map.current.panTo(nw);
            }
          }
        }, 200);
      });

      map.current.on("dblclick", "grid-layer", (e) => {
        if (singleClickTimeout) clearTimeout(singleClickTimeout);
        singleClickTimeout = null;
      });

      map.current.on("idle", () => {
        map.current.resize();
      });
    });
  }, [setSelectedCell, data]);

  return (
    <>
      <div
        className={`${styles["map-wrapper"]} ${
          selectedCell ? styles["map-wrapper-sidebar-open"] : ""
        }`}
        ref={mapWrapper}
      >
        <div ref={mapContainer} className={styles["map-container"]}>
          <Sidebar
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            map={map}
          />
          <ToggleLayersControl map={map} />
        </div>
      </div>
    </>
  );
};

export default Map;
