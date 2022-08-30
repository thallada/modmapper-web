import React, { createContext, useEffect, useRef, useState } from "react";
import MiniSearch from "minisearch";
import useSWRImmutable from "swr/immutable";

import { jsonFetcher } from "../lib/api";

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

type SearchContext = {
  cellSearch: MiniSearch;
  modSearch?: MiniSearch;
  loading: boolean;
  loadError?: any;
};

export const SearchContext = createContext<SearchContext>({
  cellSearch,
  loading: true,
});

const SearchProvider: React.FC = ({ children }) => {
  const modSearch = useRef<MiniSearch<Mod> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<Mod>>;
  const [loading, setLoading] = useState(true);

  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/mod_search_index.json`,
    (_) => jsonFetcher<Mod[]>(_)
  );

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
      modSearch.current.addAllAsync(data).then(() => {
        setLoading(false);
      });
    }
  }, [data]);

  return (
    <SearchContext.Provider
      value={{
        modSearch: modSearch.current,
        cellSearch,
        loading,
        loadError: error,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export default SearchProvider;
