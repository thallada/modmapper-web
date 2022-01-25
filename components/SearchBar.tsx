import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import type mapboxgl from "mapbox-gl";
import Fuse from "fuse.js";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/SearchBar.module.css";
import { join } from "path/posix";

type Props = {
  clearSelectedCell: () => void;
  map: React.MutableRefObject<mapboxgl.Map>;
};

interface Mod {
  name: string;
  id: number;
}

interface SearchResult {
  item: Mod;
  refIndex: number;
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

const SearchBar: React.FC<Props> = ({ clearSelectedCell, map }) => {
  const router = useRouter();

  const fuse = useRef<Fuse<Mod> | null>(null) as React.MutableRefObject<
    Fuse<Mod>
  >;

  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/mod_search_index.json`,
    jsonFetcher
  );

  useEffect(() => {
    if (data && !fuse.current) {
      fuse.current = new Fuse(data as unknown as Mod[], { keys: ["name"] });
    }
  }, [data]);

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
    if (fuse.current) {
      const results: { item: Mod; refIndex: number }[] = fuse.current.search(
        e.target.value
      );
      setResults(results);
    }
  };

  const onChooseResult =
    (item: Mod) =>
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      clearSelectedCell();
      router.push({ query: { mod: item.id } });
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
        disabled={!data}
      />
      {results.length > 0 && (
        <ul className={styles["search-results"]}>
          {results.map((result) => (
            <li
              key={result.item.id}
              onClick={onChooseResult(result.item)}
              onTouchStart={() => setClickingResult(true)}
              onMouseDown={() => setClickingResult(true)}
            >
              {result.item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
