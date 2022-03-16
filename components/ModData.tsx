import { format } from "date-fns";
import Head from "next/head";
import React from "react";
import useSWRImmutable from "swr/immutable";

import CellList from "./CellList";
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
  is_translation: boolean;
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
  setSelectedCells: (cells: { x: number; y: number }[] | null) => void;
};

const ModData: React.FC<Props> = ({
  selectedMod,
  counts,
  setSelectedCells,
}) => {
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

  setSelectedCells(data.cells);

  if (selectedMod && data) {
    return (
      <>
        <Head>
          <title key="title">{`Modmapper - ${data.name}`}</title>
          <meta
            key="description"
            name="description"
            content={`Map of Skyrim showing ${data.cells.length} cell edits from the mod: ${data.name}`}
          />
          <meta
            key="og:title"
            property="og:title"
            content={`Modmapper - ${data.name}`}
          />
          <meta
            key="og:description"
            property="og:description"
            content={`Map of Skyrim showing ${data.cells.length} cell edits from the mod: ${data.name}`}
          />
          <meta
            key="twitter:title"
            name="twitter:title"
            content={`Modmapper - ${data.name}`}
          />
          <meta
            key="twitter:description"
            name="twitter:description"
            content={`Map of Skyrim showing ${data.cells.length} cell edits from the mod: ${data.name}`}
          />
          <meta
            key="og:url"
            property="og:url"
            content={`https://modmapper.com/?mod=${data.nexus_mod_id}`}
          />
        </Head>
        <h1>
          <a
            href={`${NEXUS_MODS_URL}/mods/${data.nexus_mod_id}`}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.name}
          >
            {data.name}
          </a>
        </h1>
        <div>
          <strong>Category:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/mods/categories/${data.category_id}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {data.category_name}
          </a>
          {data.is_translation && <strong>&nbsp;(translation)</strong>}
        </div>
        <div>
          <strong>Author:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/users/${data.author_id}`}
            target="_blank"
            rel="noreferrer noopener"
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
        <CellList cells={data.cells} />
      </>
    );
  }
  return null;
};

export default ModData;
