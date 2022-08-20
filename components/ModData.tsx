import { format } from "date-fns";
import Head from "next/head";
import React, { useCallback, useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

import { useAppDispatch, useAppSelector } from "../lib/hooks";
import CellList from "./CellList";
import styles from "../styles/ModData.module.css";
import { jsonFetcher } from "../lib/api";
import {
  PluginsByHashWithMods,
  removeFetchedPlugin,
  updateFetchedPlugin,
} from "../slices/plugins";
import Link from "next/link";

export interface CellCoord {
  x: number;
  y: number;
}

export interface ModFile {
  name: string;
  version: string;
  category: string;
  nexus_file_id: number;
}

export interface FilePlugin {
  hash: number;
  file_path: string;
}

export interface FileCell {
  x: number;
  y: number;
}

export interface File {
  id: number;
  name: string;
  file_name: string;
  nexus_file_id: number;
  mod_id: number;
  category: string;
  version: string;
  mod_version: string;
  size: number;
  uploaded_at: string;
  created_at: string;
  downloaded_at: string;
  has_plugin: boolean;
  unable_to_extract_plugins: boolean;
  cells: FileCell[];
  plugins: FilePlugin[];
  plugin_count: number;
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
  files: ModFile[];
}

export const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

type Props = {
  selectedMod: number;
  selectedFile: number;
  selectedPlugin: string;
  counts: Record<number, [number, number, number]> | null;
  setSelectedCells: (cells: { x: number; y: number }[] | null) => void;
  onSelectFile: (fileId: number) => void;
  onSelectPlugin: (hash: string) => void;
};

const ModData: React.FC<Props> = ({
  selectedMod,
  selectedFile,
  selectedPlugin,
  counts,
  setSelectedCells,
  onSelectFile,
  onSelectPlugin,
}) => {
  const { data: modData, error: modError } = useSWRImmutable(
    `https://mods.modmapper.com/${selectedMod}.json`,
    (_) => jsonFetcher<Mod>(_)
  );

  const { data: fileData, error: fileError } = useSWRImmutable(
    selectedFile ? `https://files.modmapper.com/${selectedFile}.json` : null,
    (_) => jsonFetcher<File>(_)
  );

  const { data: pluginData, error: pluginError } = useSWRImmutable(
    selectedPlugin
      ? `https://plugins.modmapper.com/${selectedPlugin}.json`
      : null,
    (_) => jsonFetcher<PluginsByHashWithMods>(_)
  );

  const dispatch = useAppDispatch();
  const fetchedPlugin = useAppSelector((state) =>
    state.plugins.fetchedPlugins.find(
      (plugin) => plugin.hash === selectedPlugin
    )
  );

  const handleFileChange = useCallback(
    (event) => {
      onSelectFile(event.target.value);
    },
    [onSelectFile]
  );
  const handlePluginChange = useCallback(
    (event) => {
      onSelectPlugin(event.target.value);
    },
    [onSelectPlugin]
  );

  useEffect(() => {
    if (modData && !selectedFile) setSelectedCells(modData.cells);
  }, [modData, setSelectedCells, selectedFile]);

  useEffect(() => {
    if (fileData) setSelectedCells(fileData.cells);
  }, [fileData, setSelectedCells]);

  if (modError && modError.status === 404) {
    return <div>Mod could not be found.</div>;
  } else if (modError) {
    return <div>{`Error loading mod modData: ${modError.message}`}</div>;
  }
  if (modData === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (modData === null)
    return <div className={styles.status}>Mod could not be found.</div>;

  let numberFmt = new Intl.NumberFormat("en-US");
  const modCounts = counts && counts[modData.nexus_mod_id];
  const total_downloads = modCounts ? modCounts[0] : 0;
  const unique_downloads = modCounts ? modCounts[1] : 0;
  const views = modCounts ? modCounts[2] : 0;

  if (selectedMod && modData) {
    return (
      <>
        <Head>
          <title key="title">{`Modmapper - ${modData.name}`}</title>
          <meta
            key="description"
            name="description"
            content={`Map of Skyrim showing ${modData.cells.length} cell edits from the mod: ${modData.name}`}
          />
          <meta
            key="og:title"
            property="og:title"
            content={`Modmapper - ${modData.name}`}
          />
          <meta
            key="og:description"
            property="og:description"
            content={`Map of Skyrim showing ${modData.cells.length} cell edits from the mod: ${modData.name}`}
          />
          <meta
            key="twitter:title"
            name="twitter:title"
            content={`Modmapper - ${modData.name}`}
          />
          <meta
            key="twitter:description"
            name="twitter:description"
            content={`Map of Skyrim showing ${modData.cells.length} cell edits from the mod: ${modData.name}`}
          />
          <meta
            key="og:url"
            property="og:url"
            content={`https://modmapper.com/?mod=${modData.nexus_mod_id}`}
          />
        </Head>
        <h1>
          <a
            href={`${NEXUS_MODS_URL}/mods/${modData.nexus_mod_id}`}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.name}
          >
            {modData.name}
          </a>
        </h1>
        <div>
          <strong>Category:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/mods/categories/${modData.category_id}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {modData.category_name}
          </a>
          {modData.is_translation && <strong>&nbsp;(translation)</strong>}
        </div>
        <div>
          <strong>Author:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/users/${modData.author_id}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {modData.author_name}
          </a>
        </div>
        <div>
          <strong>Uploaded:</strong>{" "}
          {format(new Date(modData.first_upload_at), "d MMM y")}
        </div>
        <div>
          <strong>Last Update:</strong>{" "}
          {format(new Date(modData.last_update_at), "d MMM y")}
        </div>
        <div>
          <strong>Total Downloads:</strong> {numberFmt.format(total_downloads)}
        </div>
        <div>
          <strong>Unique Downloads:</strong>{" "}
          {numberFmt.format(unique_downloads)}
        </div>
        <div className={styles["select-container"]}>
          <label htmlFor="mod-file-select" className={styles.label}>
            Select file:
          </label>
          <select
            name="file"
            id="mod-file-select"
            className={styles.select}
            onChange={handleFileChange}
            value={selectedFile ?? ""}
          >
            <option value="">--Select file--</option>
            {[...modData.files].reverse().map((file) => (
              <option key={file.nexus_file_id} value={file.nexus_file_id}>
                {file.name} (v{file.version}) ({file.category})
              </option>
            ))}
          </select>
        </div>
        {fileData && (
          <div className={styles["select-container"]}>
            <label htmlFor="file-plugin-select" className={styles.label}>
              Select plugin:
            </label>
            <select
              name="plugin"
              id="file-plugin-select"
              className={styles.select}
              onChange={handlePluginChange}
              value={selectedPlugin ?? ""}
            >
              <option value="">--Select plugin--</option>
              {fileData.plugins.map((plugin) => (
                <option key={plugin.hash} value={plugin.hash}>
                  {plugin.file_path}
                </option>
              ))}
            </select>
          </div>
        )}
        {pluginData ? (
          <div className={styles["plugin-actions"]}>
            <Link href={`/?plugin=${pluginData.hash}`}>
              <a className={styles["plugin-link"]}>View plugin</a>
            </Link>
            <button
              className={styles.button}
              onClick={() =>
                fetchedPlugin
                  ? dispatch(removeFetchedPlugin(pluginData.hash))
                  : dispatch(
                      updateFetchedPlugin({ ...pluginData, enabled: true })
                    )
              }
            >
              {Boolean(fetchedPlugin) ? "Remove plugin" : "Add plugin"}
            </button>
          </div>
        ) : (
          <div className={styles.spacer} />
        )}
        {fileError &&
          (fileError.status === 404 ? (
            <div>File cound not be found.</div>
          ) : (
            <div>{`Error loading file data: ${fileError.message}`}</div>
          ))}
        {pluginError &&
          (pluginError.status === 404 ? (
            <div>Plugin cound not be found.</div>
          ) : (
            <div>{`Error loading plugin data: ${pluginError.message}`}</div>
          ))}
        <CellList
          cells={pluginData?.cells ?? fileData?.cells ?? modData.cells}
        />
      </>
    );
  }
  return null;
};

export default ModData;
