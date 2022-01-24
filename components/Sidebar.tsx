import React from "react";
import { useRouter } from "next/router";

import CellData from "./CellData";
import styles from "../styles/Sidebar.module.css";

interface Cell {
  x: number;
  y: number;
  form_id: number;
}

type Props = {
  selectedCell: { x: number; y: number } | null;
  clearSelectedCell: () => void;
  map: React.MutableRefObject<mapboxgl.Map | null>;
};

const Sidebar: React.FC<Props> = ({ selectedCell, clearSelectedCell, map }) => {
  const router = useRouter();

  const onClose = () => {
    clearSelectedCell();
  };

  if (selectedCell) {
    return (
      <div className={styles.sidebar}>
        <button className={styles.close} onClick={onClose}>
          ✖
        </button>
        <h1>
          Cell {selectedCell.x}, {selectedCell.y}
        </h1>
        {selectedCell && <CellData selectedCell={selectedCell} />}
      </div>
    );
  } else if (router.query.mod) {
    return (
      <div className={styles.sidebar}>
        <button className={styles.close} onClick={onClose}>
          ✖
        </button>
        <h1>Mod {router.query.mod}</h1>
      </div>
    );
  } else {
    return null;
  }
};

export default Sidebar;
