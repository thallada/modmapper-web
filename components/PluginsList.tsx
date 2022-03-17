import Link from "next/link";
import React from "react";

import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { excludedPlugins } from "../lib/plugins";
import {
  enableAllPlugins,
  disableAllPlugins,
  togglePlugin,
} from "../slices/plugins";
import styles from "../styles/PluginList.module.css";

type Props = {
  selectedCell?: { x: number; y: number };
};

const PluginsList: React.FC<Props> = ({ selectedCell }) => {
  const dispatch = useAppDispatch();
  const plugins = useAppSelector((state) =>
    selectedCell
      ? state.plugins.plugins.filter((plugin) =>
          plugin.parsed?.cells.some(
            (cell) =>
              cell.x === selectedCell.x &&
              cell.y === selectedCell.y &&
              // TODO: support other worlds
              cell.world_form_id === 60
          )
        )
      : state.plugins.plugins
  );
  const pluginsPending = useAppSelector((state) => state.plugins.pending);

  return (
    <>
      {plugins.length > 0 && <h2>Loaded Plugins ({plugins.length})</h2>}
      {!selectedCell && plugins.length > 0 && (
        <div className={styles.buttons}>
          <button onClick={() => dispatch(enableAllPlugins())}>
            Enable all
          </button>
          <button onClick={() => dispatch(disableAllPlugins())}>
            Disable all
          </button>
        </div>
      )}
      <ol
        className={`${styles["plugin-list"]} ${
          plugins.length > 0 ? styles["bottom-spacing"] : ""
        }`}
      >
        {plugins.map((plugin) => (
          <li key={plugin.filename} title={plugin.filename}>
            <input
              id={plugin.filename}
              type="checkbox"
              disabled={
                excludedPlugins.includes(plugin.filename) || !!plugin.parseError
              }
              checked={plugin.enabled}
              onChange={() => dispatch(togglePlugin(plugin.filename))}
            />
            <label htmlFor={plugin.filename} className={styles["plugin-label"]}>
              {excludedPlugins.includes(plugin.filename) ? (
                <span>{plugin.filename}</span>
              ) : (
                <Link href={`/?plugin=${plugin.hash}`}>
                  <a
                    className={plugin.parseError ? styles["plugin-error"] : ""}
                  >
                    {plugin.filename}
                  </a>
                </Link>
              )}
            </label>
          </li>
        ))}
      </ol>
      {pluginsPending > 0 && (
        <span className={styles.loading}>
          Loading {pluginsPending} plugin{pluginsPending === 1 ? "" : "s"}
        </span>
      )}
    </>
  );
};

export default PluginsList;
