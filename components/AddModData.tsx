import { format } from "date-fns";
import React, { useCallback, useContext, useState } from "react";
import useSWRImmutable from "swr/immutable";

import { Mod, File, NEXUS_MODS_URL } from "./ModData";
import styles from "../styles/AddModData.module.css";
import { jsonFetcher } from "../lib/api";
import { DownloadCountsContext } from "./DownloadCountsProvider";
import { GamesContext } from "./GamesProvider";

type Props = {
  selectedMod: number;
  selectedPlugin: string | null;
  setSelectedPlugin: (plugin: string) => void;
};

const AddModData: React.FC<Props> = ({
  selectedMod,
  selectedPlugin,
  setSelectedPlugin,
}) => {
  const {
    games,
    getGameNameById,
    error: gamesError,
  } = useContext(GamesContext);
  const counts = useContext(DownloadCountsContext);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);

  const { data: modData, error: modError } = useSWRImmutable(
    selectedMod ? `https://mods.modmapper.com/${selectedMod}.json` : null,
    (_) => jsonFetcher<Mod>(_)
  );
  const { data: fileData, error: fileError } = useSWRImmutable(
    selectedFile ? `https://files.modmapper.com/${selectedFile}.json` : null,
    (_) => jsonFetcher<File>(_)
  );

  const handleFileChange = useCallback(
    (event) => {
      setSelectedFile(event.target.value);
    },
    [setSelectedFile]
  );
  const handlePluginChange = useCallback(
    (event) => {
      setSelectedPlugin(event.target.value);
    },
    [setSelectedPlugin]
  );

  if (modError && modError.status === 404) {
    return <div>Mod could not be found.</div>;
  } else if (modError) {
    return <div>{`Error loading mod data: ${modError.message}`}</div>;
  }
  if (modData === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (modData === null)
    return <div className={styles.status}>Mod could not be found.</div>;

  let numberFmt = new Intl.NumberFormat("en-US");
  const gameName = getGameNameById(modData.game_id);
  const gameDownloadCounts = gameName && counts[gameName].counts;
  const modCounts =
    gameDownloadCounts && gameDownloadCounts[modData.nexus_mod_id];
  const total_downloads = modCounts ? modCounts[0] : 0;
  const unique_downloads = modCounts ? modCounts[1] : 0;
  const views = modCounts ? modCounts[2] : 0;

  const renderDownloadCountsLoading = () => (
    <div>Loading live download counts...</div>
  );
  const renderDownloadCountsError = (error: Error) => (
    <div>{`Error loading live download counts: ${error.message}`}</div>
  );
  const renderGamesError = (error?: Error) =>
    error ? (
      <div>{`Error loading games: ${error.message}`}</div>
    ) : (
      <div>Error loading games</div>
    );

  if (selectedMod && modData) {
    return (
      <div className={styles.wrapper}>
        <h3>
          <a
            href={`${NEXUS_MODS_URL}/mods/${modData.nexus_mod_id}`}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.name}
          >
            {modData.name}
          </a>
        </h3>
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
        {(!counts.skyrim.counts || !counts.skyrimspecialedition.counts) &&
          renderDownloadCountsLoading()}
        {(!games || gamesError) && renderGamesError(gamesError)}
        {counts.skyrim.error && renderDownloadCountsError(counts.skyrim.error)}
        {counts.skyrimspecialedition.error &&
          renderDownloadCountsError(counts.skyrimspecialedition.error)}
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
      </div>
    );
  }
  return null;
};

export default AddModData;
