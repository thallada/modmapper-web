import React, { useEffect } from "react";
import useSWRImmutable from "swr/immutable";

import { useAppDispatch, useAppSelector } from "../lib/hooks";
import {
  setSelectedFetchedPlugin,
  PluginFile,
  PluginsByHashWithMods,
  updateFetchedPlugin,
  removeFetchedPlugin,
} from "../slices/plugins";
import ModList from "./ModList";
import CellList from "./CellList";
import type { CellCoord } from "./ModData";
import PluginData, { Plugin as PluginProps } from "./PluginData";
import styles from "../styles/PluginDetail.module.css";
import { jsonFetcher } from "../lib/api";

const buildPluginProps = (
  data?: PluginsByHashWithMods | null,
  plugin?: PluginFile
): PluginProps => {
  const dataPlugin = data && data.plugins.length > 0 && data.plugins[0];
  return {
    hash: (plugin && plugin.hash) || (dataPlugin && dataPlugin.hash) || "",
    size: plugin?.size || (dataPlugin && dataPlugin.size) || 0,
    author:
      plugin?.parsed?.header.author ||
      (dataPlugin && dataPlugin.author) ||
      undefined,
    description:
      plugin?.parsed?.header.description ||
      (dataPlugin && dataPlugin.description) ||
      undefined,
    masters:
      plugin?.parsed?.header.masters ||
      (dataPlugin && dataPlugin.masters) ||
      [],
    file_name: plugin?.filename || (dataPlugin && dataPlugin.file_name) || "",
    cell_count:
      plugin?.parsed?.cells.length || (data && data.cells.length) || 0,
  };
};

type Props = {
  hash: string;
  counts: Record<number, [number, number, number]> | null;
};

const PluginDetail: React.FC<Props> = ({ hash, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://plugins.modmapper.com/${hash}.json`,
    (_) => jsonFetcher<PluginsByHashWithMods>(_)
  );

  const dispatch = useAppDispatch();
  const parsedPlugin = useAppSelector((state) =>
    state.plugins.parsedPlugins.find((plugin) => plugin.hash === hash)
  );
  const fetchedPlugin = useAppSelector((state) =>
    state.plugins.fetchedPlugins.find((plugin) => plugin.hash === hash)
  );

  useEffect(() => {
    if (data) {
      dispatch(setSelectedFetchedPlugin(data));
    }
  }, [dispatch, data]);

  if (!parsedPlugin && error && error.status === 404) {
    return <h3>Plugin could not be found.</h3>;
  } else if (!parsedPlugin && error) {
    return <div>{`Error loading plugin data: ${error.message}`}</div>;
  }
  if (!parsedPlugin && data === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (!parsedPlugin && data === null)
    return <div className={styles.status}>Plugin could not be found.</div>;

  return (
    <>
      <PluginData
        plugin={buildPluginProps(data, parsedPlugin)}
        counts={counts}
      />
      {data && (
        <button
          className={styles.button}
          onClick={() =>
            fetchedPlugin
              ? dispatch(removeFetchedPlugin(data.hash))
              : dispatch(updateFetchedPlugin({ ...data, enabled: true }))
          }
        >
          {Boolean(fetchedPlugin) ? "Remove plugin" : "Add plugin"}
        </button>
      )}
      {data && <ModList mods={data.mods} files={data.files} counts={counts} />}
      {parsedPlugin?.parseError && (
        <div className={styles.error}>
          {`Error parsing plugin: ${parsedPlugin.parseError}`}
        </div>
      )}
      <CellList
        cells={
          (parsedPlugin?.parsed?.cells.filter(
            (cell) =>
              cell.x !== undefined &&
              cell.y !== undefined &&
              cell.world_form_id === 60 &&
              parsedPlugin.parsed?.header.masters[0] === "Skyrim.esm"
          ) as CellCoord[]) ||
          data?.cells ||
          []
        }
      />
    </>
  );
};

export default PluginDetail;
