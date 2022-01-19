import React from "react";

import CellData from "./CellData";
import styles from "../styles/Sidebar.module.css";

interface Cell {
  x: number;
  y: number;
  form_id: number;
}

type Props = {
  selectedCell: [number, number] | null;
  setSelectedCell: (cell: [number, number] | null) => void;
  map: React.MutableRefObject<mapboxgl.Map | null>;
};

const Sidebar: React.FC<Props> = ({ selectedCell, setSelectedCell, map }) => {
  const onClose = () => {
    setSelectedCell(null);
    if (map.current) map.current.removeFeatureState({ source: "grid-source" });
    if (map.current && map.current.getLayer("selected-cell-layer")) {
      map.current.removeLayer("selected-cell-layer");
    }
    if (map.current && map.current.getSource("selected-cell-source")) {
      map.current.removeSource("selected-cell-source");
    }
    requestAnimationFrame(() => {
      if (map.current) map.current.resize();
    });
  };

  return (
    selectedCell && (
      <div className={styles.sidebar}>
        <button className={styles.close} onClick={onClose}>
          ✖
        </button>
        <h1>
          Cell {selectedCell[0]}, {selectedCell[1]}
        </h1>
        {selectedCell && <CellData selectedCell={selectedCell} />}
      </div>
    )
  );
};

export default Sidebar;
