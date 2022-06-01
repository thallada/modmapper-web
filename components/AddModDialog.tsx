import { createPortal } from "react-dom";
import React, { useState, useRef } from "react";

import AddModData from "./AddModData";
import SearchBar from "./SearchBar";
import styles from "../styles/AddModDialog.module.css";

type Props = {
  counts: Record<number, [number, number, number]> | null;
};

const AddModDialog: React.FC<Props> = ({ counts }) => {
  const [selectedMod, setSelectedMod] = useState<number | null>(null);
  const [dialogShown, setDialogShown] = useState(false);
  const searchInput = useRef<HTMLInputElement | null>(null);

  const onAddModButtonClick = async () => {
    setSelectedMod(null);
    setDialogShown(true);
    requestAnimationFrame(() => {
      if (searchInput.current) searchInput.current.focus();
    });
  };

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
              <AddModData selectedMod={selectedMod} counts={counts} />
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
                  console.log(`Adding mod ${selectedMod}`);
                  setDialogShown(false);
                }}
                disabled={!selectedMod}
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
