import React, { useEffect, useState } from "react";
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
import Link from "next/link";

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
};

const PluginDetail: React.FC<Props> = ({ hash }) => {
  const [showAddRemovePluginNotification, setShowAddRemovePluginNotification] =
    useState<boolean>(false);

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
      <PluginData plugin={buildPluginProps(data, parsedPlugin)} />
      {data && (
        <>
          <button
            className={styles.button}
            onClick={() => {
              if (fetchedPlugin) {
                dispatch(removeFetchedPlugin(data.hash));
              } else {
                dispatch(updateFetchedPlugin({ ...data, enabled: true }));
              }
              setShowAddRemovePluginNotification(true);
            }}
          >
            {Boolean(fetchedPlugin) ? "Remove plugin" : "Add plugin"}
          </button>
          {showAddRemovePluginNotification && (
            <span>
              Plugin {Boolean(fetchedPlugin) ? "added" : "removed"}.{" "}
              <Link href="/#added-plugins">
                <a>View list</a>
              </Link>
              .
            </span>
          )}
        </>
      )}
      {data && <ModList mods={data.mods} files={data.files} />}
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
