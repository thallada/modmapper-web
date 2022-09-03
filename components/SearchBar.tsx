import { useCombobox } from "downshift";
import React, { useContext, useState, useRef } from "react";
import { SearchResult } from "minisearch";

import { SearchContext } from "./SearchProvider";
import styles from "../styles/SearchBar.module.css";
import { DownloadCountsContext } from "./DownloadCountsProvider";
import { GameName } from "./GamesProvider";

type Props = {
  sidebarOpen: boolean;
  placeholder: string;
  onSelectResult: (item: SearchResult | null) => void;
  includeCells?: boolean;
  fixed?: boolean;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
};

function gamePrefex(game: GameName): string {
  switch (game) {
    case "skyrim":
      return "[LE]";
    case "skyrimspecialedition":
      return "[SSE]";
    default:
      return "";
  }
}

const SearchBar: React.FC<Props> = ({
  sidebarOpen,
  placeholder,
  onSelectResult,
  includeCells = false,
  fixed = false,
  inputRef,
}) => {
  const counts = useContext(DownloadCountsContext);
  const { cellSearch, modSearch, loading, loadError } =
    useContext(SearchContext);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const renderSearchIndexError = (error: Error) => (
    <div className={styles.error}>
      Error loading mod search index: {loadError.message}.
    </div>
  );
  const renderDownloadCountsLoading = () => (
    <div>Loading live download counts...</div>
  );
  const renderDownloadCountsError = (error: Error) => (
    <div
      className={styles.error}
    >{`Error loading live download counts: ${error.message}`}</div>
  );

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
              const countsA = counts[resultA.game as GameName].counts;
              const countsB = counts[resultB.game as GameName].counts;
              if (countsA && countsB) {
                const countA = countsA[resultA.id];
                const countB = countsB[resultB.id];
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
                {gamePrefex(result.game)} {result.name}
              </li>
            ))}
          {loadError && renderSearchIndexError(loadError)}
          {counts.skyrim.error &&
            renderDownloadCountsError(counts.skyrim.error)}
          {counts.skyrimspecialedition.error &&
            renderDownloadCountsError(counts.skyrimspecialedition.error)}
          {(!counts.skyrim.counts || !counts.skyrimspecialedition.counts) &&
            renderDownloadCountsLoading()}
        </ul>
      </div>
    </>
  );
};

export default SearchBar;
