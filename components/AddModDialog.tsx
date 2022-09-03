import { createPortal } from "react-dom";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import useSWRImmutable from "swr/immutable";

import AddModData from "./AddModData";
import SearchBar from "./SearchBar";
import { jsonFetcher } from "../lib/api";
import { updateFetchedPlugin, PluginsByHashWithMods } from "../slices/plugins";
import styles from "../styles/AddModDialog.module.css";
import EscapeListener from "./EscapeListener";

const AddModDialog: React.FC = () => {
  const [selectedMod, setSelectedMod] = useState<number | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [dialogShown, setDialogShown] = useState(false);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const dispatch = useDispatch();

  const { data, error } = useSWRImmutable(
    selectedPlugin
      ? `https://plugins.modmapper.com/${selectedPlugin}.json`
      : null,
    (_) => jsonFetcher<PluginsByHashWithMods>(_)
  );

  const onAddModButtonClick = useCallback(async () => {
    setSelectedMod(null);
    setDialogShown(true);
    requestAnimationFrame(() => {
      if (searchInput.current) searchInput.current.focus();
    });
  }, [setSelectedMod, setDialogShown]);

  return (
    <>
      <EscapeListener onEscape={() => setDialogShown(false)} />
      <button onClick={onAddModButtonClick}>Add mod</button>
      {typeof window !== "undefined" &&
        createPortal(
          <dialog open={dialogShown} className={styles.dialog}>
            <h3>Add mod</h3>
            <SearchBar
              sidebarOpen={false}
              placeholder="Search mods…"
              onSelectResult={(selectedItem) => {
                if (selectedItem) {
                  setSelectedMod(selectedItem.id);
                }
              }}
              inputRef={searchInput}
            />
            {selectedMod && (
              <AddModData
                selectedMod={selectedMod}
                selectedPlugin={selectedPlugin}
                setSelectedPlugin={setSelectedPlugin}
              />
            )}
            <menu>
              <button
                onClick={() => {
                  setSelectedMod(null);
                  setDialogShown(false);
                  if (searchInput.current) searchInput.current.value = "";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (data)
                    dispatch(updateFetchedPlugin({ ...data, enabled: true }));
                  setDialogShown(false);
                }}
                disabled={!selectedMod || !selectedPlugin || !data}
              >
                Add
              </button>
            </menu>
          </dialog>,
          document.body
        )}
    </>
  );
};

export default AddModDialog;
