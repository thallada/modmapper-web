import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { AppState } from "../lib/store"

export type PluginsTxtState = string;

const initialState: PluginsTxtState = "";

export const pluginsTxtSlice = createSlice({
  name: "pluginsTxt",
  initialState,
  reducers: {
    setPluginsTxt: (state, action: PayloadAction<string>) => action.payload,
    clearPluginsTxt: (state) => "",
  },
})

export const { setPluginsTxt, clearPluginsTxt } = pluginsTxtSlice.actions

export const selectPluginsTxt = (state: AppState) => state.pluginsTxt

export default pluginsTxtSlice.reducer