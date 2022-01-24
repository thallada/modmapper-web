import React, { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";

import styles from "../styles/ToggleLayersControl.module.css";

type Props = {
  map: React.MutableRefObject<mapboxgl.Map>;
};

const ToggleLayersControl: React.FC<Props> = ({ map }) => {
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [labelsVisible, setLabelsVisible] = useState(true);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        "heatmap-layer",
        "visibility",
        heatmapVisible ? "visible" : "none"
      );
    }
  }, [map, heatmapVisible]);
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        "graticule",
        "visibility",
        gridVisible ? "visible" : "none"
      );
    }
  }, [map, gridVisible]);
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        "grid-labels-layer",
        "visibility",
        labelsVisible ? "visible" : "none"
      );
    }
  }, [map, labelsVisible]);

  return (
    <div className="mapboxgl-ctrl-top-left">
      <div className="mapboxgl-ctrl mapboxgl-ctrl-group">
        <button
          type="button"
          onClick={() => setHeatmapVisible(!heatmapVisible)}
          className={`${styles["heatmap-toggle"]} ${
            !heatmapVisible ? styles["toggle-off"] : ""
          }`}
          title="Toggle heatmap"
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
        <button
          type="button"
          onClick={() => setGridVisible(!gridVisible)}
          className={`${styles["grid-toggle"]} ${
            !gridVisible ? styles["toggle-off"] : ""
          }`}
          title="Toggle cell grid"
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
        <button
          type="button"
          onClick={() => setLabelsVisible(!labelsVisible)}
          className={`${styles["labels-toggle"]} ${
            !labelsVisible ? styles["toggle-off"] : ""
          }`}
          title="Toggle cell labels"
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
      </div>
    </div>
  );
};

export default ToggleLayersControl;
