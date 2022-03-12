import React from "react";
import useSWRImmutable from "swr/immutable";

import { useAppSelector } from "../lib/hooks";
import { PluginFile } from "../slices/plugins";
import { Mod } from "./ModData";
import { Cell } from "./CellData";
import CellModList from "./CellModList";
import PluginData, { Plugin as PluginProps } from "./PluginData";
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
}

export interface PluginsByHashWithMods {
  hash: number;
  plugins: Plugin[];
  files: File[];
  mods: Mod[];
  cells: Cell[];
}

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

const jsonFetcher = async (url: string): Promise<PluginsByHashWithMods | null> => {
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

const buildPluginProps = (data?: PluginsByHashWithMods | null, plugin?: PluginFile): PluginProps => {
  const dataPlugin = data && data.plugins.length > 0 && data.plugins[0];
  return {
    hash: (plugin && plugin.hash) || (dataPlugin && dataPlugin.hash.toString(36)) || "",
    size: plugin?.size || (dataPlugin && dataPlugin.size) || 0,
    author: plugin?.parsed?.header.author || (dataPlugin && dataPlugin.author) || undefined,
    description: plugin?.parsed?.header.description || (dataPlugin && dataPlugin.description) || undefined,
    masters: plugin?.parsed?.header.masters || (dataPlugin && dataPlugin.masters) || [],
    file_name: plugin?.filename || (dataPlugin && dataPlugin.file_name) || "",
    cell_count: plugin?.parsed?.cells.length || (data && data.cells.length) || 0,
  }
}


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
        plugin={buildPluginProps(data, plugin)}
        counts={counts}
      />
      {data && <CellModList mods={data.mods} counts={counts} />}
    </>
  );
};

export default PluginDetail;
