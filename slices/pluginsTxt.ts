import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { AppState, AppThunk } from "../lib/store"
import { applyLoadOrder } from "./plugins";

export type PluginsTxtState = string;

const initialState: PluginsTxtState = "";

export const pluginsTxtSlice = createSlice({
  name: "pluginsTxt",
  initialState,
  reducers: {
    setPluginsTxt: (state, action: PayloadAction<string>) => action.payload,
    clearPluginsTxt: () => "",
  },
})

export const { setPluginsTxt, clearPluginsTxt } = pluginsTxtSlice.actions

export const selectPluginsTxt = (state: AppState) => state.pluginsTxt

export const setPluginsTxtAndApplyLoadOrder = (pluginsTxt: string): AppThunk => (dispatch) => {
  dispatch(setPluginsTxt(pluginsTxt));
  dispatch(applyLoadOrder());
}

export default pluginsTxtSlice.reducer