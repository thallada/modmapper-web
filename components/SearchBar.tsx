import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import type mapboxgl from "mapbox-gl";
import Fuse from "fuse.js";

import styles from "../styles/SearchBar.module.css";

type Props = {
  clearSelectedCell: () => void;
  map: React.MutableRefObject<mapboxgl.Map>;
};

interface Mod {
  title: string;
  nexus_mod_id: number;
}

interface SearchResult {
  item: Mod;
  refIndex: number;
}

const list: Mod[] = [
  { title: "Unofficial Skyrim Special Edition Patch", nexus_mod_id: 1 },
  { title: "Enhanced Lights and FX", nexus_mod_id: 2 },
  { title: "Majestic Mountains", nexus_mod_id: 3 },
];

const SearchBar: React.FC<Props> = ({ clearSelectedCell, map }) => {
  const router = useRouter();
  const fuse = new Fuse(list, { keys: ["title"] });

  const searchInput = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [clickingResult, setClickingResult] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchInput.current) {
      if (
        searchFocused &&
        global.document.activeElement !== searchInput.current
      ) {
        searchInput.current.focus();
      } else if (
        !searchFocused &&
        global.document.activeElement === searchInput.current
      ) {
        searchInput.current.blur();
      }
    }
  }, [searchFocused]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const results: { item: Mod; refIndex: number }[] = fuse.search(
      e.target.value
    );
    setResults(results);
  };

  const onChooseResult =
    (item: Mod) =>
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      clearSelectedCell();
      router.push({ query: { mod: item.nexus_mod_id } });
      setSearch("");
      setResults([]);
      setClickingResult(false);
      setSearchFocused(false);
    };

  return (
    <div
      className={`${styles["search-bar"]} ${
        searchFocused ? styles["search-bar-focused"] : ""
      }`}
    >
      <input
        type="text"
        placeholder="Search mods or cells…"
        onChange={onChange}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => {
          if (!clickingResult) {
            setSearch("");
            setResults([]);
            setSearchFocused(false);
          }
        }}
        value={search}
        ref={searchInput}
      />
      {results.length > 0 && (
        <ul className={styles["search-results"]}>
          {results.map((result) => (
            <li
              key={result.item.nexus_mod_id}
              onClick={onChooseResult(result.item)}
              onTouchStart={() => setClickingResult(true)}
              onMouseDown={() => setClickingResult(true)}
            >
              {result.item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
