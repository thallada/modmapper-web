import { useCombobox } from "downshift";
import React, { useEffect, useState, useRef } from "react";
import MiniSearch, { SearchResult } from "minisearch";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/SearchBar.module.css";
import { jsonFetcher } from "../lib/api";

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

let cells = [];

for (let x = -77; x < 76; x++) {
  for (let y = -50; y < 45; y++) {
    const id = `${x},${y}`;
    cells.push({ id, name: `Cell ${id}`, x, y });
  }
}
const cellSearch = new MiniSearch({
  fields: ["id"],
  storeFields: ["id", "name", "x", "y"],
  tokenize: (s) => [s.replace(/(cell\s?)|\s/gi, "")],
  searchOptions: {
    fields: ["id"],
    prefix: true,
    fuzzy: false,
  },
});
cellSearch.addAll(cells);

const SearchBar: React.FC<Props> = ({
  counts,
  sidebarOpen,
  placeholder,
  onSelectResult,
  includeCells = false,
  fixed = false,
  inputRef,
}) => {
  const [rendered, setRendered] = useState(false);

  const modSearch = useRef<MiniSearch<Mod> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<Mod>>;

  const { data, error } = useSWRImmutable(
    rendered && `https://mods.modmapper.com/mod_search_index.json`,
    (_) => jsonFetcher<Mod[]>(_)
  );

  useEffect(() => {
    // awful hack to delay rendering of the mod_search_index.json, since it can block rendering somehow
    requestAnimationFrame(() => setRendered(true));
  });

  useEffect(() => {
    if (data && !modSearch.current) {
      modSearch.current = new MiniSearch({
        fields: ["name"],
        storeFields: ["name", "id"],
        searchOptions: {
          fields: ["name"],
          fuzzy: 0.2,
          prefix: true,
        },
      });
      modSearch.current.addAll(data);
    }
  }, [data]);

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
          modSearch.current &&
          !/(^cell\s?-?\d+\s?,?\s?-?\d*$)|(^-?\d+\s?,\s?-?\d*$)/i.test(
            inputValue
          )
        ) {
          results = results.concat(
            modSearch.current.search(inputValue).sort((resultA, resultB) => {
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
            placeholder,
            onFocus: () => setSearchFocused(true),
            onBlur: () => {
              if (!isOpen) setSearchFocused(false);
            },
            disabled: !data,
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
          {error && (
            <div className={styles.error}>
              Error loading mod search index: {error}.
            </div>
          )}
        </ul>
      </div>
    </>
  );
};

export default SearchBar;
