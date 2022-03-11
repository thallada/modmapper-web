import Head from "next/head";
import React from "react";

import styles from "../styles/PluginData.module.css";
import { Cell } from "./CellData";

export interface Plugin {
  id: number;
  name: string;
  hash: bigint;
  file_id: number;
  mod_id: number;
  version: number;
  size: number;
  author?: string;
  description?: string;
  masters: string[];
  file_name: string;
  file_path: string;
  updated_at: Date;
  created_at: Date;
  cells: Omit<Cell, "mods">[];
}

type Props = {
  plugin: Plugin;
  counts: Record<number, [number, number, number]> | null;
};

const PluginData: React.FC<Props> = ({ plugin, counts }) => {
  if (!plugin) {
    return <h3>Plugin could not be found.</h3>;
  }

  return (
    <>
      <Head>
        <title key="title">{`Modmapper - ${plugin.file_name}`}</title>
        <meta
          key="description"
          name="description"
          content={`Map of Skyrim showing ${plugin.cells.length} cell edits from the plugin: ${plugin.file_name}`}
        />
        <meta
          key="og:title"
          property="og:title"
          content={`Modmapper - ${plugin.file_name}`}
        />
        <meta
          key="og:description"
          property="og:description"
          content={`Map of Skyrim showing ${plugin.cells.length} cell edits from the plugin: ${plugin.file_name}`}
        />
        <meta
          key="twitter:title"
          name="twitter:title"
          content={`Modmapper - ${plugin.file_name}`}
        />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={`Map of Skyrim showing ${plugin.cells.length} cell edits from the plugin: ${plugin.file_name}`}
        />
        <meta
          key="og:url"
          property="og:url"
          content={`https://modmapper.com/?plugin=${plugin.hash}`}
        />
      </Head>
      <h1 className={styles.name}>{plugin.file_name}</h1>
      {plugin.author && (
        <div>
          <strong>Author:&nbsp;</strong>
          {plugin.author}
        </div>
      )}
      {plugin.masters.length > 0 && (
        <div>
          <strong>Master plugins:&nbsp;</strong>
          {plugin.masters.join(", ")}
        </div>
      )}
      <div>
        <strong>Cell edits:&nbsp;</strong>
        {plugin.cells.length}
      </div>
      {plugin.description && (
        <div>
          <h3>Description:</h3>
          <p>{plugin.description}</p>
        </div>
      )}
    </>
  );
};

export default PluginData;
