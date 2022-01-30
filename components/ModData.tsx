import { format } from "date-fns";
import React from "react";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/ModData.module.css";

export interface CellCoord {
  x: number;
  y: number;
}

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
  cells: CellCoord[];
}

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

const jsonFetcher = async (url: string): Promise<Mod | null> => {
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
  selectedMod: number;
  counts: Record<number, [number, number, number]> | null;
};

const ModData: React.FC<Props> = ({ selectedMod, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/${selectedMod}.json`,
    jsonFetcher
  );

  if (error && error.status === 404) {
    return <div>Mod could not be found.</div>;
  } else if (error) {
    return <div>{`Error loading mod data: ${error.message}`}</div>;
  }
  if (data === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (data === null)
    return <div className={styles.status}>Mod could not be found.</div>;

  let numberFmt = new Intl.NumberFormat("en-US");
  const modCounts = counts && counts[data.nexus_mod_id];
  const total_downloads = modCounts ? modCounts[0] : 0;
  const unique_downloads = modCounts ? modCounts[1] : 0;
  const views = modCounts ? modCounts[2] : 0;

  if (selectedMod && data) {
    return (
      <>
        <h1>
          <a
            href={`${NEXUS_MODS_URL}/mods/${data.nexus_mod_id}`}
            className={`${styles.link} ${styles.name}`}
          >
            {data.name}
          </a>
        </h1>
        <div>
          <strong>Category:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/mods/categories/${data.category_id}`}
            className={styles.link}
          >
            {data.category_name}
          </a>
        </div>
        <div>
          <strong>Author:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/users/${data.author_id}`}
            className={styles.link}
          >
            {data.author_name}
          </a>
        </div>
        <div>
          <strong>Uploaded:</strong>{" "}
          {format(new Date(data.first_upload_at), "d MMM y")}
        </div>
        <div>
          <strong>Last Update:</strong>{" "}
          {format(new Date(data.last_update_at), "d MMM y")}
        </div>
        <div>
          <strong>Total Downloads:</strong> {numberFmt.format(total_downloads)}
        </div>
        <div>
          <strong>Unique Downloads:</strong>{" "}
          {numberFmt.format(unique_downloads)}
        </div>
      </>
    );
  }
  return null;
};

export default ModData;
