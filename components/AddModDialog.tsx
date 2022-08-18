import { createPortal } from "react-dom";
import React, { useCallback, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import useSWRImmutable from "swr/immutable";

import AddModData from "./AddModData";
import SearchBar from "./SearchBar";
import { jsonFetcher } from "../lib/api";
import { updateFetchedPlugin, PluginsByHashWithMods } from "../slices/plugins";
import styles from "../styles/AddModDialog.module.css";

type Props = {
  counts: Record<number, [number, number, number]> | null;
};

const AddModDialog: React.FC<Props> = ({ counts }) => {
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
      <button onClick={onAddModButtonClick}>Add mod</button>
      {typeof window !== "undefined" &&
        createPortal(
          <dialog open={dialogShown} className={styles.dialog}>
            <h3>Add mod</h3>
            <SearchBar
              counts={counts}
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
                counts={counts}
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
                  console.log(`Adding mod ${selectedMod} ${selectedPlugin}`);
                  if (data) dispatch(updateFetchedPlugin(data));
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
