import React from "react";
import useSWRImmutable from "swr/immutable";

import { useAppSelector } from "../lib/hooks";
import { Mod } from "./ModData";
import PluginData from "./PluginData";
import styles from "../styles/PluginData.module.css";

export interface File {
  id: number;
  name: string;
  file_name: string;
  nexus_file_id: number;
  mod_id: number;
  category?: string;
  version?: string;
  mod_version?: string;
  size: number;
  uploaded_at?: Date;
  has_download_link: boolean;
  updated_at: Date;
  created_at: Date;
  downloaded_at?: Date;
  has_plugin: boolean;
  unable_to_extract_plugins: boolean;
}

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
  file: File;
  mod: Omit<Mod, "cells">;
}

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

const jsonFetcher = async (url: string): Promise<Plugin | null> => {
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
  hash: string;
  counts: Record<number, [number, number, number]> | null;
};

const PluginDetail: React.FC<Props> = ({ hash, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://plugins.modmapper.com/${hash}.json`,
    jsonFetcher
  );

  const plugins = useAppSelector((state) => state.plugins.plugins);
  const plugin = plugins.find((plugin) => plugin.hash === hash);

  if (!plugin && error && error.status === 404) {
    return <h3>Plugin could not be found.</h3>;
  } else if (!plugin && error) {
    return <div>{`Error loading plugin data: ${error.message}`}</div>;
  }
  if (!plugin && data === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (!plugin && data === null)
    return <div className={styles.status}>Plugin could not be found.</div>;

  return (
    <>
      <PluginData
        plugin={
          // TODO: merge into one common plugin object
          data || {
            id: plugin!.id,
            name: plugin!.name,
            hash: plugin!.hash,
            file_id: plugin!.file_id,
            mod_id: plugin!.mod_id,
            version: plugin!.version,
            size: plugin!.size,
            author: plugin!.author,
            description: plugin!.description,
            masters: plugin!.masters,
            file_name: plugin!.filename,
            file_path: plugin!.filepath,
            updated_at: plugin!.updated_at,
            created_at: plugin!.created_at,
            cells: plugin!.cells,
          }
        }
      />
    </>
  );
};

export default PluginDetail;
