import React, { useCallback, useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Gradient from "javascript-color-gradient";
import mapboxgl from "mapbox-gl";
import useSWRImmutable from "swr/immutable";

import { useAppSelector } from "../lib/hooks";
import { PluginFile } from "../slices/plugins";
import styles from "../styles/Map.module.css";
import Sidebar from "./Sidebar";
import ToggleLayersControl from "./ToggleLayersControl";
import SearchBar from "./SearchBar";

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

const LIVE_DOWNLOAD_COUNTS_URL =
  "https://staticstats.nexusmods.com/live_download_counts/mods/1704.csv";

const jsonFetcher = (url: string) =>
  fetch(url).then(async (res) => ({
    lastModified: res.headers.get("Last-Modified"),
    data: await res.json(),
  }));
const csvFetcher = (url: string) => fetch(url).then((res) => res.text());

const Map: React.FC = () => {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement | null>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;
  const map = useRef<mapboxgl.Map | null>(
    null
  ) as React.MutableRefObject<mapboxgl.Map>;
  const mapWrapper = useRef<HTMLDivElement | null>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [heatmapLoaded, setHeatmapLoaded] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedCells, setSelectedCells] = useState<
    | {
        x: number;
        y: number;
      }[]
    | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const plugins = useAppSelector((state) => state.plugins.plugins);
  const pluginsPending = useAppSelector((state) => state.plugins.pending);
  const fetchedPlugin = useAppSelector((state) => state.plugins.fetchedPlugin);

  const { data: cellsData, error: cellsError } = useSWRImmutable(
    "https://cells.modmapper.com/edits.json",
    jsonFetcher
  );
  // The live download counts are not really immutable, but I'd still rather load them once per session
  const [counts, setCounts] = useState<Record<
    number,
    [number, number, number]
  > | null>(null);
  const { data: countsData, error: countsError } = useSWRImmutable(
    LIVE_DOWNLOAD_COUNTS_URL,
    csvFetcher
  );

  const selectMapCell = useCallback(
    (cell: { x: number; y: number }) => {
      if (!map.current) return;
      if (map.current && !map.current.getSource("grid-source")) return;

      map.current.removeFeatureState({ source: "grid-source" });
      map.current.setFeatureState(
        {
          source: "grid-source",
          id: (cell.x + 57) * 1000 + 50 - cell.y,
        },
        {
          selected: true,
        }
      );
      map.current.removeFeatureState({ source: "selected-cell-source" });
      map.current.removeFeatureState({ source: "conflicted-cell-source" });
      map.current.setFeatureState(
        {
          source: "selected-cell-source",
          id: (cell.x + 57) * 1000 + 50 - cell.y,
        },
        {
          cellSelected: true,
          modSelected: false,
        }
      );
      requestAnimationFrame(() => map.current && map.current.resize());

      const panTo = () => {
        const zoom = map.current.getZoom();
        const viewportNW = map.current.project([-180, 85.051129]);
        const cellSize = Math.pow(2, zoom + 2);
        const x = cell.x + 57;
        const y = 50 - cell.y;
        let nw = map.current.unproject([
          x * cellSize + viewportNW.x,
          y * cellSize + viewportNW.y,
        ]);
        let se = map.current.unproject([
          x * cellSize + viewportNW.x + cellSize,
          y * cellSize + viewportNW.y + cellSize,
        ]);

        const bounds = map.current.getBounds();
        if (!bounds.contains(nw) || !bounds.contains(se)) {
          map.current.panTo(nw);
        }
      };
      const bearing = map.current.getBearing();
      const pitch = map.current.getPitch();
      // This logic breaks with camera rotation / pitch
      if (bearing !== 0 || pitch !== 0) {
        map.current.easeTo({ bearing: 0, pitch: 0, duration: 300 });
        setTimeout(() => {
          panTo();
        }, 300);
      } else {
        panTo();
      }
    },
    [map]
  );

  const selectCells = useCallback(
    (cells: { x: number; y: number }[]) => {
      if (!map.current) return;
      if (map.current && !map.current.getSource("grid-source")) return;

      map.current.removeFeatureState({ source: "selected-cell-source" });
      map.current.removeFeatureState({ source: "conflicted-cell-source" });
      const visited: { [id: number]: boolean } = {};
      for (let cell of cells) {
        const id = (cell.x + 57) * 1000 + 50 - cell.y;
        map.current.setFeatureState(
          {
            source: "selected-cell-source",
            id,
          },
          {
            modSelected: true,
            cellSelected: false,
          }
        );
        map.current.setFeatureState(
          {
            source: "conflicted-cell-source",
            id,
          },
          {
            conflicted: visited[id] === true ? true : false,
          }
        );
        visited[id] = true;
      }

      let bounds: mapboxgl.LngLatBounds | null = null;
      const fitBounds = () => {
        const zoom = map.current.getZoom();
        const viewportNW = map.current.project([-180, 85.051129]);
        const cellSize = Math.pow(2, zoom + 2);

        for (const cell of cells) {
          const x = cell.x + 57;
          const y = 50 - cell.y;
          let ne = map.current.unproject([
            x * cellSize + viewportNW.x + cellSize,
            y * cellSize + viewportNW.y,
          ]);
          let sw = map.current.unproject([
            x * cellSize + viewportNW.x,
            y * cellSize + viewportNW.y + cellSize,
          ]);
          if (bounds) {
            bounds.extend(new mapboxgl.LngLatBounds(sw, ne));
          } else {
            bounds = new mapboxgl.LngLatBounds(sw, ne);
          }
        }

        requestAnimationFrame(() => {
          if (map.current) {
            map.current.resize();
            if (bounds) {
              map.current.fitBounds(bounds, { padding: 40 });
            }
          }
        });
      };

      const bearing = map.current.getBearing();
      const pitch = map.current.getPitch();
      // This logic breaks with camera rotation / pitch
      if (bearing !== 0 || pitch !== 0) {
        map.current.easeTo({ bearing: 0, pitch: 0, duration: 300 });
        setTimeout(() => {
          fitBounds();
        }, 300);
      } else {
        fitBounds();
      }
    },
    [map]
  );

  const selectCell = useCallback(
    (cell) => {
      router.push({ query: { cell: cell.x + "," + cell.y } });
      setSelectedCell(cell);
      setSidebarOpen(true);
      selectMapCell(cell);
    },
    [setSelectedCell, selectMapCell, router]
  );

  const clearSelectedCell = useCallback(() => {
    setSelectedCell(null);
    if (map.current) map.current.removeFeatureState({ source: "grid-source" });
    if (map.current) {
      map.current.removeFeatureState({ source: "selected-cell-source" });
      map.current.removeFeatureState({ source: "conflicted-cell-source" });
    }
    requestAnimationFrame(() => {
      if (map.current) map.current.resize();
    });
  }, [map]);

  const clearSelectedCells = useCallback(() => {
    setSelectedCells(null);
    if (map.current) {
      map.current.removeFeatureState({ source: "selected-cell-source" });
      map.current.removeFeatureState({ source: "conflicted-cell-source" });
    }
    requestAnimationFrame(() => {
      if (map.current) map.current.resize();
    });
  }, [map]);

  const clearSelectedMod = useCallback(() => {
    requestAnimationFrame(() => {
      if (map.current) map.current.resize();
    });
  }, [map]);

  const setSidebarOpenWithResize = useCallback(
    (open) => {
      setSidebarOpen(open);
      requestAnimationFrame(() => {
        if (map.current) map.current.resize();
      });
    },
    [map]
  );

  useEffect(() => {
    if (!heatmapLoaded) return; // wait for all map layers to load
    if (router.query.cell && typeof router.query.cell === "string") {
      const cellUrlParts = decodeURIComponent(router.query.cell).split(",");
      const cell = {
        x: parseInt(cellUrlParts[0]),
        y: parseInt(cellUrlParts[1]),
      };
      if (
        !selectedCell ||
        selectedCell.x !== cell.x ||
        selectedCell.y !== cell.y
      ) {
        clearSelectedCells();
        selectCell(cell);
      }
    } else if (router.query.mod && typeof router.query.mod === "string") {
      if (selectedCells) {
        clearSelectedCell();
        setSidebarOpen(true);
        selectCells(selectedCells);
      } else {
        // TODO: this is so spaghetti
        clearSelectedCell();
      }
    } else if (router.query.plugin && typeof router.query.plugin === "string") {
      setSidebarOpen(true);
      if (plugins && plugins.length > 0 && pluginsPending === 0) {
        const plugin = plugins.find((p) => p.hash === router.query.plugin);
        if (plugin && plugin.parsed) {
          const cells = [];
          const cellSet = new Set<number>();
          for (const cell of plugin?.parsed?.cells) {
            if (
              cell.x !== undefined &&
              cell.y !== undefined &&
              cell.world_form_id === 60 &&
              cellSet.has(cell.x + cell.y * 1000) === false
            ) {
              cells.push({ x: cell.x, y: cell.y });
              cellSet.add(cell.x + cell.y * 1000);
            }
          }
          selectCells(cells);
        }
      }
    } else if (plugins && plugins.length > 0 && pluginsPending === 0) {
      clearSelectedCells();
      clearSelectedCell();
      const cells = plugins.reduce(
        (acc: { x: number; y: number }[], plugin: PluginFile) => {
          if (plugin.enabled && plugin.parsed) {
            const newCells = [...acc];
            for (const cell of plugin.parsed.cells) {
              if (
                cell.x !== undefined &&
                cell.y !== undefined &&
                cell.world_form_id === 60
              ) {
                newCells.push({ x: cell.x, y: cell.y });
              }
            }
            return newCells;
          }
          return acc;
        },
        []
      );
      selectCells(cells);
    } else {
      clearSelectedCells();
      clearSelectedCell();
    }
  }, [
    selectedCell,
    selectedCells,
    router.query.cell,
    router.query.mod,
    router.query.plugin,
    selectCell,
    selectCells,
    clearSelectedCell,
    clearSelectedCells,
    heatmapLoaded,
    plugins,
    pluginsPending,
  ]);

  useEffect(() => {
    if (!heatmapLoaded) return; // wait for all map layers to load
    if (
      router.query.plugin &&
      typeof router.query.plugin === "string" &&
      fetchedPlugin &&
      fetchedPlugin.cells
    ) {
      const cells = [];
      const cellSet = new Set<number>();
      for (const cell of fetchedPlugin.cells) {
        if (
          cell.x !== undefined &&
          cell.y !== undefined &&
          cellSet.has(cell.x + cell.y * 1000) === false
        ) {
          cells.push({ x: cell.x, y: cell.y });
          cellSet.add(cell.x + cell.y * 1000);
        }
      }
      selectCells(cells);
    }
  }, [heatmapLoaded, fetchedPlugin, selectCells, router.query.plugin]);

  useEffect(() => {
    if (!heatmapLoaded) return; // wait for all map layers to load
    if (!router.query.mod || typeof router.query.mod !== "string") {
      clearSelectedMod();
    }
  }, [router.query.mod, clearSelectedMod, heatmapLoaded]);

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
              'Map tiles by <a href="https://en.uesp.net/wiki/Skyrim:Skyrim" target="_blank">UESP</a>. Mod data from <a href="https://nexusmods.com" target="_blank">Nexus Mods</a>.',
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
    map.current.on("load", () => {
      setMapLoaded(true);
    });
  }, [setMapLoaded]);

  useEffect(() => {
    if (!cellsData || !router.isReady || !mapLoaded) return; // wait for map to initialize and data to load
    if (map.current.getSource("graticule")) return; // don't initialize twice

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
      let lat = map.current.unproject([-180, y * cellSize + viewportNW.y]).lat;
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
        const editCount = (cellsData.data as Record<string, number>)[
          `${x - 57},${50 - y}`
        ];
        grid.features.push({
          type: "Feature",
          id: x * 1000 + y,
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

    const selectedCellLines: GeoJSON.FeatureCollection<
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
        selectedCellLines.features.push({
          type: "Feature",
          id: x * 1000 + y,
          geometry: {
            type: "LineString",
            coordinates: [
              [nw.lng, nw.lat],
              [ne.lng, ne.lat],
              [se.lng, se.lat],
              [sw.lng, sw.lat],
              [nw.lng, nw.lat],
              [ne.lng, ne.lat],
            ],
          },
          properties: { x: x, y: y },
        });
      }
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
        "line-color": [
          "case",
          ["boolean", ["feature-state", "cellSelected"], false],
          "blue",
          ["boolean", ["feature-state", "modSelected"], false],
          "purple",
          "transparent",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "modSelected"], false],
          4,
          3,
        ],
      },
      layout: {
        "line-join": "round",
      },
    });

    const conflictedCellLines: GeoJSON.FeatureCollection<
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
        conflictedCellLines.features.push({
          type: "Feature",
          id: x * 1000 + y,
          geometry: {
            type: "LineString",
            coordinates: [
              [nw.lng, nw.lat],
              [ne.lng, ne.lat],
              [se.lng, se.lat],
              [sw.lng, sw.lat],
              [nw.lng, nw.lat],
              [ne.lng, ne.lat],
            ],
          },
          properties: { x: x, y: y },
        });
      }
    }

    map.current.addSource("conflicted-cell-source", {
      type: "geojson",
      data: conflictedCellLines,
    });
    map.current.addLayer({
      id: "conflicted-cell-layer",
      type: "line",
      source: "conflicted-cell-source",
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "conflicted"], false],
          "red",
          "transparent",
        ],
        "line-width": 4,
      },
      layout: {
        "line-join": "round",
      },
    });

    const fullscreenControl = new mapboxgl.FullscreenControl();
    (fullscreenControl as unknown as { _container: HTMLElement })._container =
      mapWrapper.current;
    map.current.addControl(fullscreenControl);
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("click", "grid-layer", (e) => {
      const features = e.features;
      if (features && features[0]) {
        const cell = {
          x: features[0].properties!.cellX,
          y: features[0].properties!.cellY,
        };
        router.push({ query: { cell: cell.x + "," + cell.y } });
      }
    });

    setHeatmapLoaded(true);
  }, [cellsData, mapLoaded, router, setHeatmapLoaded]);

  useEffect(() => {
    if (countsData) {
      const newCounts: Record<number, [number, number, number]> = {};
      for (const line of countsData.split("\n")) {
        const nums = line.split(",").map((count) => parseInt(count, 10));
        newCounts[nums[0]] = [nums[1], nums[2], nums[3]];
      }
      setCounts(newCounts);
    }
  }, [setCounts, countsData]);

  return (
    <>
      <div
        className={`${styles["map-wrapper"]} ${
          sidebarOpen ? styles["map-wrapper-sidebar-open"] : ""
        }`}
        ref={mapWrapper}
      >
        <div ref={mapContainer} className={styles["map-container"]}>
          <Sidebar
            selectedCell={selectedCell}
            clearSelectedCell={() => router.push({ query: {} })}
            setSelectedCells={setSelectedCells}
            counts={counts}
            countsError={countsError}
            open={sidebarOpen}
            setOpen={setSidebarOpenWithResize}
            lastModified={cellsData && cellsData.lastModified}
          />
          <ToggleLayersControl map={map} />
          <SearchBar counts={counts} sidebarOpen={sidebarOpen} />
        </div>
      </div>
    </>
  );
};

export default Map;
