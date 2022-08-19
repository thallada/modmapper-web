import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { AppState, AppThunk } from "../lib/store"
import { excludedPlugins } from "../lib/plugins";
import { Mod } from "../components/ModData";

export interface Header {
  author?: string;
  description?: string;
  masters: string[];
  next_object_id: number;
  num_records_and_groups: number;
  version: number;
}

export interface Cell {
  editor_id?: string;
  form_id: number;
  is_persistent: boolean;
  world_form_id?: number;
  x?: 0;
  y?: 0;
}

export interface World {
  editor_id: string;
  form_id: number;
}

export interface ParsedPlugin {
  header: Header;
  cells: Cell[];
  worlds: World[];
}

export interface PluginFile {
  parsed?: ParsedPlugin;
  filename: string;
  lastModified: number;
  hash: string;
  parseError?: string;
  enabled: boolean;
  size: number;
}

export interface File {
  id: number;
  name: string;
  file_name: string;
  nexus_file_id: number;
  mod_id: number;
  category?: string;
  version?: string;
  mod_version?: string;
  size: number;
  uploaded_at?: number;
  has_download_link: boolean;
  updated_at: Date;
  created_at: Date;
  downloaded_at?: Date;
  has_plugin: boolean;
  unable_to_extract_plugins: boolean;
}

export interface FetchedPlugin {
  id: number;
  name: string;
  hash: string;
  file_id: number;
  mod_id: number;
  version: number;
  size: number;
  author?: string;
  description?: string;
  masters: string[];
  file_name: string;
  file_path: string;
  updated_at: Date;
  created_at: Date;
}

export interface FetchedCell {
  x: 0;
  y: 0;
}

export interface PluginsByHashWithMods {
  hash: string;
  plugins: FetchedPlugin[];
  files: File[];
  mods: Mod[];
  cells: FetchedCell[];
  enabled?: boolean;
}

export type PluginsState = {
  parsedPlugins: PluginFile[];
  fetchedPlugins: PluginsByHashWithMods[];
  selectedFetchedPlugin?: PluginsByHashWithMods;
  pending: number;
}

const initialState: PluginsState = { parsedPlugins: [], fetchedPlugins: [], pending: 0 };

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
    addParsedPlugin: (state: PluginsState, action: PayloadAction<PluginFile>) => ({
      ...state,
      parsedPlugins: [...state.parsedPlugins, action.payload],
    }),
    addFetchedPlugin: (state: PluginsState, action: PayloadAction<PluginsByHashWithMods>) => ({
      ...state,
      fetchedPlugins: [...state.fetchedPlugins, action.payload],
    }),
    updateParsedPlugin: (state: PluginsState, action: PayloadAction<PluginFile>) => ({
      ...state,
      parsedPlugins: [...state.parsedPlugins.filter(plugin => plugin.hash !== action.payload.hash), action.payload],
    }),
    updateFetchedPlugin: (state: PluginsState, action: PayloadAction<PluginsByHashWithMods>) => ({
      ...state,
      fetchedPlugins: [...state.fetchedPlugins.filter(plugin => plugin.hash !== action.payload.hash), action.payload],
    }),
    removeFetchedPlugin: (state: PluginsState, action: PayloadAction<string>) => ({
      ...state,
      fetchedPlugins: state.fetchedPlugins.filter(plugin => plugin.hash !== action.payload),
    }),
    setParsedPlugins: (state: PluginsState, action: PayloadAction<PluginFile[]>) => ({
      ...state,
      parsedPlugins: action.payload,
    }),
    setFetchedPlugins: (state: PluginsState, action: PayloadAction<PluginsByHashWithMods[]>) => ({
      ...state,
      fetchedPlugins: action.payload,
    }),
    setPending: (state: PluginsState, action: PayloadAction<number>) => ({
      ...state,
      pending: action.payload,
    }),
    decrementPending: (state: PluginsState, action: PayloadAction<number>) => ({
      ...state,
      pending: state.pending - action.payload,
    }),
    toggleParsedPlugin: (state: PluginsState, action: PayloadAction<string>) => ({
      ...state,
      parsedPlugins: state.parsedPlugins.map((plugin) => (plugin.filename === action.payload ? { ...plugin, enabled: !plugin.enabled } : plugin)),
    }),
    toggleFetchedPlugin: (state: PluginsState, action: PayloadAction<string>) => ({
      ...state,
      fetchedPlugins: state.fetchedPlugins.map((plugin) => (plugin.hash === action.payload ? { ...plugin, enabled: !plugin.enabled } : plugin)),
    }),
    enableAllParsedPlugins: (state: PluginsState) => ({
      ...state,
      parsedPlugins: state.parsedPlugins.map((plugin) => ({ ...plugin, enabled: !plugin.parseError && !excludedPlugins.includes(plugin.filename) && true })),
    }),
    enableAllFetchedPlugins: (state: PluginsState) => ({
      ...state,
      fetchedPlugins: state.fetchedPlugins.map((plugin) => ({ ...plugin, enabled: true })),
    }),
    disableAllParsedPlugins: (state: PluginsState) => ({
      ...state,
      parsedPlugins: state.parsedPlugins.map((plugin) => ({ ...plugin, enabled: false })),
    }),
    disableAllFetchedPlugins: (state: PluginsState) => ({
      ...state,
      fetchedPlugins: state.fetchedPlugins.map((plugin) => ({ ...plugin, enabled: false })),
    }),
    setSelectedFetchedPlugin: (state: PluginsState, action: PayloadAction<PluginsByHashWithMods | undefined>) => ({
      ...state,
      selectedFetchedPlugin: action.payload,
    }),
    clearParsedPlugins: (state: PluginsState) => ({
      ...state,
      parsedPlugins: [],
      pending: 0,
    }),
  },
})

export const {
  addParsedPlugin,
  addFetchedPlugin,
  updateParsedPlugin,
  updateFetchedPlugin,
  removeFetchedPlugin,
  setParsedPlugins,
  setFetchedPlugins,
  setPending,
  decrementPending,
  toggleParsedPlugin,
  toggleFetchedPlugin,
  enableAllParsedPlugins,
  enableAllFetchedPlugins,
  disableAllParsedPlugins,
  disableAllFetchedPlugins,
  setSelectedFetchedPlugin,
  clearParsedPlugins,
} = pluginsSlice.actions;

export const selectPlugins = (state: AppState) => state.plugins

export const applyLoadOrder = (): AppThunk => (dispatch, getState) => {
  const { plugins, pluginsTxt } = getState();
  const originalPlugins = [...plugins.parsedPlugins];
  let newPlugins = [];
  for (let line of pluginsTxt.split("\n")) {
    let enabled = false;
    line = line.trim(); // remove carriage return at end of line
    if (line.startsWith("#")) {
      continue;
    }
    if (line.startsWith("*")) {
      enabled = true;
      line = line.slice(1);
    }

    const originalIndex = originalPlugins.findIndex((p) => p.filename === line);
    if (originalIndex >= 0) {
      const original = originalPlugins.splice(originalIndex, 1)[0];
      if (original) {
        newPlugins.push({ ...original, enabled });
      }
    }
  }
  dispatch(setParsedPlugins([...originalPlugins.sort((a, b) => b.lastModified - a.lastModified), ...newPlugins]));
}

export const addParsedPluginInOrder = (plugin: PluginFile): AppThunk => (dispatch) => {
  dispatch(updateParsedPlugin(plugin));
  dispatch(applyLoadOrder());
}

export default pluginsSlice.reducer