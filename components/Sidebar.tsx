import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWRImmutable from "swr/immutable";

import CellData from "./CellData";
import ModData from "./ModData";
import styles from "../styles/Sidebar.module.css";
import { render } from "react-dom";

const LIVE_DOWNLOAD_COUNTS_URL =
  "https://staticstats.nexusmods.com/live_download_counts/mods/1704.csv";

const csvFetcher = (url: string) => fetch(url).then((res) => res.text());
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
  // The live download counts are not really immutable, but I'd still rather load them once per session
  const { data, error } = useSWRImmutable(LIVE_DOWNLOAD_COUNTS_URL, csvFetcher);
  const [counts, setCounts] = useState<
    [number, number, number, number][] | null
  >(null);

  useEffect(() => {
    if (data) {
      setCounts(
        data
          .split("\n")
          .map((line) =>
            line.split(",").map((count) => parseInt(count, 10))
          ) as [number, number, number, number][]
      );
    }
  }, [setCounts, data]);

  const renderLoadError = (error: Error) => (
    <div>{`Error loading live download counts: ${error.message}`}</div>
  );

  const renderLoading = () => <div>Loading...</div>;

  const renderCellData = (selectedCell: { x: number; y: number }) => {
    if (error) return renderLoadError(error);
    if (!counts) return renderLoading();

    return <CellData selectedCell={selectedCell} counts={counts} />;
  };

  const renderModData = (selectedMod: number) => {
    if (error) return renderLoadError(error);
    if (!counts) return renderLoading();

    return <ModData selectedMod={selectedMod} counts={counts} />;
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
