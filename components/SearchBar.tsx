import { useCombobox } from "downshift";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import type mapboxgl from "mapbox-gl";
import MiniSearch, { SearchResult } from "minisearch";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/SearchBar.module.css";

type Props = {
  clearSelectedCell: () => void;
  map: React.MutableRefObject<mapboxgl.Map>;
  counts: Record<number, [number, number, number]> | null;
};

interface Mod {
  name: string;
  id: number;
}

const jsonFetcher = async (url: string): Promise<Mod | null> => {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

const SearchBar: React.FC<Props> = ({ clearSelectedCell, counts, map }) => {
  const router = useRouter();

  const searchEngine = useRef<MiniSearch<Mod> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<Mod>>;

  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/mod_search_index.json`,
    jsonFetcher
  );

  useEffect(() => {
    if (data && !searchEngine.current) {
      searchEngine.current = new MiniSearch({
        fields: ["name"],
        storeFields: ["name", "id"],
        searchOptions: {
          fields: ["name"],
          fuzzy: 0.2,
        },
      });
      searchEngine.current.addAll(data as unknown as Mod[]);
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
      if (searchEngine.current && inputValue) {
        const results: SearchResult[] = searchEngine.current.search(inputValue);
        setResults(results);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setSearchFocused(false);
        router.push({ query: { mod: selectedItem.id } });
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
        }`}
        {...getComboboxProps()}
      >
        <input
          {...getInputProps({
            type: "text",
            placeholder: "Search mods or cells…",
            onFocus: () => setSearchFocused(true),
            onBlur: () => {
              if (!isOpen) setSearchFocused(false);
            },
            disabled: !data,
            ref: searchInput,
          })}
        />
        <ul
          className={styles["search-results"]}
          style={!isOpen ? { display: "none" } : {}}
          {...getMenuProps()}
        >
          {isOpen &&
            results
              .sort((resultA, resultB) => {
                if (counts) {
                  const countA = counts[resultA.id];
                  const countB = counts[resultB.id];
                  if (countA && countB) return countB[2] - countA[2];
                }
                return 0;
              })
              .map((result, index) => (
                <li
                  key={result.id}
                  {...getItemProps({ item: result, index })}
                  className={`${
                    highlightedIndex === index
                      ? styles["highlighted-result"]
                      : ""
                  }`}
                >
                  {result.name}
                </li>
              ))}
        </ul>
      </div>
    </>
  );
};

export default SearchBar;
