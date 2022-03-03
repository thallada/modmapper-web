import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { AppState, AppThunk } from "../lib/store"

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
}

export type PluginsState = {
  plugins: PluginFile[];
  pending: number;
}

const initialState: PluginsState = { plugins: [], pending: 0 };

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
    addPlugin: (state, action: PayloadAction<PluginFile>) => ({ plugins: [...state.plugins, action.payload], pending: state.pending }),
    setPlugins: (state, action: PayloadAction<PluginFile[]>) => ({ plugins: action.payload, pending: state.pending }),
    setPending: (state, action: PayloadAction<number>) => ({ plugins: state.plugins, pending: action.payload }),
    decrementPending: (state, action: PayloadAction<number>) => ({ plugins: state.plugins, pending: state.pending - action.payload }),
    togglePlugin: (state, action: PayloadAction<string>) => ({ plugins: state.plugins.map((plugin) => (plugin.filename === action.payload ? { ...plugin, enabled: !plugin.enabled } : plugin)), pending: state.pending }),
    clearPlugins: () => ({ plugins: [], pending: 0 }),
  },
})

export const { addPlugin, setPlugins, setPending, decrementPending, togglePlugin, clearPlugins } = pluginsSlice.actions

export const selectPlugins = (state: AppState) => state.plugins

export const applyLoadOrder = (): AppThunk => (dispatch, getState) => {
  const { plugins, pluginsTxt } = getState();
  console.log("applying load order!");
  const originalPlugins = [...plugins.plugins];
  console.log(originalPlugins);
  console.log(originalPlugins[0] && originalPlugins[0].filename);
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

    console.log(line);
    const originalIndex = originalPlugins.findIndex((p) => p.filename === line);
    if (originalIndex >= 0) {
      const original = originalPlugins.splice(originalIndex, 1)[0];
      console.log(original);
      if (original) {
        newPlugins.push({ ...original, enabled });
      }
    }
  }
  console.log(originalPlugins);
  console.log(newPlugins);
  dispatch(setPlugins([...originalPlugins.sort((a, b) => b.lastModified - a.lastModified), ...newPlugins]));
}

export const addPluginInOrder = (plugin: PluginFile): AppThunk => (dispatch) => {
  dispatch(addPlugin(plugin));
  dispatch(applyLoadOrder());
}

export default pluginsSlice.reducer