import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { Mod } from '../components/CellData';

export type ModWithCounts = Mod & {
  total_downloads: number;
  unique_downloads: number;
  views: number;
  exterior_cells_edited: number;
};

export type ModListFiltersState = {
  sortBy: keyof ModWithCounts,
  sortAsc: boolean,
  filter?: string,
  game: string,
  category: string,
  includeTranslations: boolean,
}

const initialState: ModListFiltersState = {
  sortBy: "unique_downloads",
  sortAsc: false,
  filter: undefined,
  game: "All",
  category: "All",
  includeTranslations: true,
};

export const modListFiltersSlice = createSlice({
  name: "modListFilters",
  initialState,
  reducers: {
    setSortBy: (state, action: PayloadAction<keyof ModWithCounts>) => ({
      ...state,
      sortBy: action.payload,
    }),
    setSortAsc: (state, action: PayloadAction<boolean>) => ({
      ...state,
      sortAsc: action.payload,
    }),
    setFilter: (state, action: PayloadAction<string | undefined>) => ({
      ...state,
      filter: action.payload,
    }),
    setGame: (state, action: PayloadAction<string>) => ({
      ...state,
      game: action.payload,
    }),
    setCategory: (state, action: PayloadAction<string>) => ({
      ...state,
      category: action.payload,
    }),
    setIncludeTranslations: (state, action: PayloadAction<boolean>) => ({
      ...state,
      includeTranslations: action.payload,
    }),
    clearFilters: () => initialState,
  },
})

export const { setSortBy, setSortAsc, setFilter, setGame, setCategory, setIncludeTranslations, clearFilters } = modListFiltersSlice.actions

export default modListFiltersSlice.reducer