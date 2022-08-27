import { useCombobox } from "downshift";
import React, { useContext, useState, useRef } from "react";
import { SearchResult } from "minisearch";

import { SearchContext } from "./SearchProvider";
import styles from "../styles/SearchBar.module.css";

type Props = {
  counts: Record<number, [number, number, number]> | null;
  sidebarOpen: boolean;
  placeholder: string;
  onSelectResult: (item: SearchResult | null) => void;
  includeCells?: boolean;
  fixed?: boolean;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
};

interface Mod {
  name: string;
  id: number;
}

const SearchBar: React.FC<Props> = ({
  counts,
  sidebarOpen,
  placeholder,
  onSelectResult,
  includeCells = false,
  fixed = false,
  inputRef,
}) => {
  const { cellSearch, modSearch, loading, loadError } =
    useContext(SearchContext);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    reset,
  } = useCombobox({
    items: results,
    itemToString: (item) => (item ? item.name : ""),
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) {
        let results: SearchResult[] = [];
        if (
          modSearch &&
          !/(^cell\s?-?\d+\s?,?\s?-?\d*$)|(^-?\d+\s?,\s?-?\d*$)/i.test(
            inputValue
          )
        ) {
          results = results.concat(
            modSearch.search(inputValue).sort((resultA, resultB) => {
              if (counts) {
                const countA = counts[resultA.id];
                const countB = counts[resultB.id];
                const scoreA = resultA.score;
                const scoreB = resultB.score;
                if (countA && countB && scoreA && scoreB) {
                  if (scoreA === scoreB) {
                    return countB[2] - countA[2];
                  } else {
                    return scoreB - scoreA;
                  }
                }
              }
              return 0;
            })
          );
        }
        if (includeCells) {
          results = results.concat(cellSearch.search(inputValue));
        }
        setResults(results.splice(0, 30));
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setSearchFocused(false);
        onSelectResult(selectedItem);
        if (searchInput.current) searchInput.current.blur();
        reset();
      }
    },
  });

  return (
    <>
      <div
        className={`${styles["search-bar"]} ${
          searchFocused ? styles["search-bar-focused"] : ""
        } ${fixed ? styles["search-bar-fixed"] : ""} ${
          sidebarOpen ? styles["search-bar-sidebar-open"] : ""
        }`}
        {...getComboboxProps()}
      >
        <input
          {...getInputProps({
            type: "text",
            placeholder:
              modSearch && !loading ? placeholder : "Search (loading...)",
            onFocus: () => setSearchFocused(true),
            onBlur: () => {
              if (!isOpen) setSearchFocused(false);
            },
            disabled: !modSearch,
            ref: (ref) => {
              searchInput.current = ref;
              if (inputRef) inputRef.current = ref;
            },
          })}
        />
        <ul
          className={styles["search-results"]}
          style={!isOpen ? { display: "none" } : {}}
          {...getMenuProps()}
        >
          {isOpen &&
            results.map((result, index) => (
              <li
                key={result.id}
                {...getItemProps({ item: result, index })}
                className={`${
                  highlightedIndex === index ? styles["highlighted-result"] : ""
                }`}
              >
                {result.name}
              </li>
            ))}
          {loadError && (
            <div className={styles.error}>
              Error loading mod search index: {loadError}.
            </div>
          )}
        </ul>
      </div>
    </>
  );
};

export default SearchBar;
