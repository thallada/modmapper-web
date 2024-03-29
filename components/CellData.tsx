import Head from "next/head";
import React from "react";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/CellData.module.css";
import ModList from "./ModList";
import ParsedPluginsList from "./ParsedPluginsList";
import { jsonFetcher } from "../lib/api";
import FetchedPluginsList from "./FetchedPluginsList";

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

type Props = {
  selectedCell: { x: number; y: number };
};

const CellData: React.FC<Props> = ({ selectedCell }) => {
  const { data, error } = useSWRImmutable(
    `https://cells.modmapper.com/${selectedCell.x}/${selectedCell.y}.json`,
    (_) => jsonFetcher<Cell>(_)
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
        <Head>
          <title key="title">{`Modmapper - Cell ${data.x}, ${data.y}`}</title>
          <meta
            key="description"
            name="description"
            content={`Map of Skyrim showing ${data.mods_count} mods that edit cell ${data.x}, ${data.y}`}
          />
          <meta
            key="og:title"
            property="og:title"
            content={`Modmapper - Cell ${data.x}, ${data.y}`}
          />
          <meta
            key="og:description"
            property="og:description"
            content={`Map of Skyrim showing ${data.mods_count} mods that edit cell ${data.x}, ${data.y}`}
          />
          <meta
            key="twitter:title"
            name="twitter:title"
            content={`Modmapper - Cell ${data.x}, ${data.y}`}
          />
          <meta
            key="twitter:description"
            name="twitter:description"
            content={`Map of Skyrim showing ${data.mods_count} mods that edit cell ${data.x}, ${data.y}`}
          />
          <meta
            key="og:url"
            property="og:url"
            content={`https://modmapper.com/?cell=${encodeURIComponent(
              `${data.x},${data.y}`
            )}`}
          />
        </Head>
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
        <ParsedPluginsList selectedCell={selectedCell} />
        <FetchedPluginsList selectedCell={selectedCell} />
        <ModList mods={data.mods} />
      </>
    )
  );
};

export default CellData;
