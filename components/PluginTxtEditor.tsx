import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";

import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { setPluginsTxt } from "../slices/pluginsTxt";
import { applyLoadOrder } from "../slices/plugins";
import styles from "../styles/PluginTxtEditor.module.css";

export const excludedPlugins = [
  "Skyrim.esm",
  "Update.esm",
  "Dawnguard.esm",
  "HearthFires.esm",
  "Dragonborn.esm",
];

type Props = {};

const PluginsLoader: React.FC<Props> = () => {
  const [editPluginsTxt, setEditPluginsTxt] = useState<string | null>(null);
  const [pluginsTxtShown, setPluginsTxtShown] = useState(false);
  const dispatch = useAppDispatch();
  const pluginsTxt = useAppSelector((state) => state.pluginsTxt);

  useEffect(() => {
    setPluginsTxtShown(false);
    console.log("going to apply!");
    dispatch(applyLoadOrder());
  }, [dispatch, pluginsTxt]);

  const onPluginsTxtButtonClick = async () => {
    setEditPluginsTxt(pluginsTxt);
    setPluginsTxtShown(true);
  };

  return (
    <>
      <p>
        Paste or drag-and-drop your <code>plugins.txt</code> below to sort and
        enable the loaded plugins by your current load order.
      </p>
      <button onClick={onPluginsTxtButtonClick}>
        {!pluginsTxt ? "Paste" : "Edit"} Skyrim plugins.txt file
      </button>
      {process.browser &&
        createPortal(
          <dialog open={pluginsTxtShown} className={styles.dialog}>
            <h3>Paste plugins.txt</h3>
            <p>
              The plugins.txt file is typically found at{" "}
              <code>
                C:\Users\username\AppData\Local\Skyrim Special Edition
              </code>
              . You can also drag-and-drop the file anywhere on the window to
              load the file.
            </p>
            <textarea
              value={editPluginsTxt ?? undefined}
              onChange={(e) => setEditPluginsTxt(e.target.value)}
            />
            <menu>
              <button
                onClick={() => {
                  setEditPluginsTxt(null);
                  setPluginsTxtShown(false);
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch(setPluginsTxt(editPluginsTxt ?? ""));
                  setPluginsTxtShown(false);
                }}
              >
                Save
              </button>
            </menu>
          </dialog>,
          document.body
        )}
      {process.browser &&
        createPortal(<div className={styles["drop-area"]} />, document.body)}
    </>
  );
};

export default PluginsLoader;
