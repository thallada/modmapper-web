import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { AppState, AppThunk } from "../lib/store"
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

export interface Plugin {
  header: Header;
  cells: Cell[];
  worlds: World[];
}

export interface PluginFile {
  parsed?: Plugin;
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
  uploaded_at?: Date;
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
  hash: bigint;
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

export interface PluginsByHashWithMods {
  hash: number;
  plugins: FetchedPlugin[];
  files: File[];
  mods: Mod[];
  cells: Cell[];
}

export type PluginsState = {
  plugins: PluginFile[];
  fetchedPlugin?: PluginsByHashWithMods;
  pending: number;
}

const initialState: PluginsState = { plugins: [], pending: 0 };

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
    addPlugin: (state, action: PayloadAction<PluginFile>) => ({
      plugins: [...state.plugins, action.payload],
      pending: state.pending,
      fetchedPlugin: state.fetchedPlugin,
    }),
    updatePlugin: (state, action: PayloadAction<PluginFile>) => ({
      plugins: [...state.plugins.filter(plugin => plugin.hash !== action.payload.hash), action.payload],
      pending: state.pending,
      fetchedPlugin: state.fetchedPlugin,
    }),
    setPlugins: (state, action: PayloadAction<PluginFile[]>) => ({
      plugins: action.payload,
      pending: state.pending,
      fetchedPlugin: state.fetchedPlugin,
    }),
    setPending: (state, action: PayloadAction<number>) => ({
      plugins: state.plugins,
      pending: action.payload,
      fetchedPlugin: state.fetchedPlugin,
    }),
    decrementPending: (state, action: PayloadAction<number>) => ({
      plugins: state.plugins,
      pending: state.pending - action.payload,
      fetchedPlugin: state.fetchedPlugin,
    }),
    togglePlugin: (state, action: PayloadAction<string>) => ({
      plugins: state.plugins.map((plugin) => (plugin.filename === action.payload ? { ...plugin, enabled: !plugin.enabled } : plugin)),
      pending: state.pending,
      fetchedPlugin: state.fetchedPlugin,
    }),
    setFetchedPlugin: (state, action: PayloadAction<PluginsByHashWithMods | undefined>) => ({
      plugins: state.plugins,
      pending: state.pending,
      fetchedPlugin: action.payload,
    }),
    clearPlugins: () => ({
      plugins: [],
      pending: 0,
      loadedPluginCells: [],
    }),
  },
})

export const { addPlugin, setPlugins, setPending, decrementPending, togglePlugin, setFetchedPlugin, clearPlugins } = pluginsSlice.actions

export const selectPlugins = (state: AppState) => state.plugins

export const applyLoadOrder = (): AppThunk => (dispatch, getState) => {
  const { plugins, pluginsTxt } = getState();
  const originalPlugins = [...plugins.plugins];
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
  dispatch(setPlugins([...originalPlugins.sort((a, b) => b.lastModified - a.lastModified), ...newPlugins]));
}

export const addPluginInOrder = (plugin: PluginFile): AppThunk => (dispatch) => {
  dispatch(addPlugin(plugin));
  dispatch(applyLoadOrder());
}

export default pluginsSlice.reducer