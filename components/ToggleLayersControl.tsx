import React, { useRef, useEffect, useState } from "react";

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
        "grid-layer",
        "visibility",
        heatmapVisible ? "visible" : "none"
      );
    }
  }, [heatmapVisible]);
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        "graticule",
        "visibility",
        gridVisible ? "visible" : "none"
      );
    }
  }, [gridVisible]);
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        "grid-labels-layer",
        "visibility",
        labelsVisible ? "visible" : "none"
      );
    }
  }, [labelsVisible]);

  return (
    <div className="mapboxgl-ctrl-top-left">
      <div className="mapboxgl-ctrl mapboxgl-ctrl-group">
        <button
          type="button"
          onClick={() => setHeatmapVisible(!heatmapVisible)}
          className={`${styles["heatmap-toggle"]} ${
            !heatmapVisible ? styles["toggle-off"] : ""
          }`}
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
        <button
          type="button"
          onClick={() => setGridVisible(!gridVisible)}
          className={`${styles["grid-toggle"]} ${
            !gridVisible ? styles["toggle-off"] : ""
          }`}
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
        <button
          type="button"
          onClick={() => setLabelsVisible(!labelsVisible)}
          className={styles["labels-toggle"]}
          className={`${styles["labels-toggle"]} ${
            !labelsVisible ? styles["toggle-off"] : ""
          }`}
        >
          <span className="mapboxgl-ctrl-icon" />
        </button>
      </div>
    </div>
  );
};

export default ToggleLayersControl;
