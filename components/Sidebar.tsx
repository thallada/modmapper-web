import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWRImmutable from "swr/immutable";

import CellData from "./CellData";
import ModData from "./ModData";
import styles from "../styles/Sidebar.module.css";
import { render } from "react-dom";

interface Cell {
  x: number;
  y: number;
  form_id: number;
}

type Props = {
  selectedCell: { x: number; y: number } | null;
  clearSelectedCell: () => void;
  setSelectedCells: (cells: { x: number; y: number }[] | null) => void;
  map: React.MutableRefObject<mapboxgl.Map | null>;
  counts: Record<number, [number, number, number]> | null;
  countsError: Error | null;
};

const Sidebar: React.FC<Props> = ({
  selectedCell,
  clearSelectedCell,
  setSelectedCells,
  counts,
  countsError,
  map,
}) => {
  const router = useRouter();

  const renderLoadError = (error: Error) => (
    <div>{`Error loading live download counts: ${error.message}`}</div>
  );

  const renderLoading = () => <div>Loading...</div>;

  const renderCellData = (selectedCell: { x: number; y: number }) => {
    if (countsError) return renderLoadError(countsError);
    if (!counts) return renderLoading();

    return <CellData selectedCell={selectedCell} counts={counts} />;
  };

  const renderModData = (selectedMod: number) => {
    if (countsError) return renderLoadError(countsError);
    if (!counts) return renderLoading();

    return (
      <ModData
        selectedMod={selectedMod}
        counts={counts}
        setSelectedCells={setSelectedCells}
      />
    );
  };

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
        {renderCellData(selectedCell)}
      </div>
    );
  } else if (router.query.mod) {
    const modId = parseInt(router.query.mod as string, 10);
    return (
      <div className={styles.sidebar}>
        <button className={styles.close} onClick={onClose}>
          ✖
        </button>
        {!Number.isNaN(modId) && renderModData(modId)}
      </div>
    );
  } else {
    return null;
  }
};

export default Sidebar;
