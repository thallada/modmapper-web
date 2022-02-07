import React from "react";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/CellData.module.css";
import CellModList from "./CellModList";

export interface Mod {
  id: number;
  name: string;
  nexus_mod_id: number;
  author_name: string;
  author_id: number;
  category_name: string;
  category_id: number;
  description: string;
  thumbnail_link: string;
  game_id: number;
  updated_at: string;
  created_at: string;
  last_update_at: string;
  first_upload_at: string;
  last_updated_files_at: string;
}

export interface Cell {
  form_id: number;
  x: number;
  y: number;
  is_persistent: boolean;
  mods_count: number;
  files_count: number;
  plugins_count: number;
  mods: Mod[];
}

const jsonFetcher = async (url: string): Promise<Cell | null> => {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

type Props = {
  selectedCell: { x: number; y: number };
  counts: Record<number, [number, number, number]> | null;
};

const CellData: React.FC<Props> = ({ selectedCell, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://cells.modmapper.com/${selectedCell.x}/${selectedCell.y}.json`,
    jsonFetcher
  );

  if (error && error.status === 404) {
    return <div>Cell has no mod edits.</div>;
  } else if (error) {
    return <div>{`Error loading cell data: ${error.message}`}</div>;
  }
  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Cell has no edits.</div>;

  return (
    selectedCell && (
      <>
        <ul className={styles["cell-data-list"]}>
          <li>
            <strong>Form ID:</strong>{" "}
            <span>{data.form_id.toString(16).padStart(8, "0")}</span>
          </li>
          <li>
            <strong>Mods that edit:</strong> <span>{data.mods_count}</span>
          </li>
          <li>
            <strong>Files that edit:</strong> <span>{data.files_count}</span>
          </li>
          <li>
            <strong>Plugins that edit:</strong>{" "}
            <span>{data.plugins_count}</span>
          </li>
        </ul>
        <CellModList mods={data.mods} counts={counts} />
      </>
    )
  );
};

export default CellData;
