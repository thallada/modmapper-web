import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"

import pluginsReducer from "../slices/plugins"
import pluginsTxtReducer from "../slices/pluginsTxt"
import modListFiltersReducer from "../slices/modListFilters"

export function makeStore() {
  return configureStore({
    reducer: { pluginsTxt: pluginsTxtReducer, plugins: pluginsReducer, modListFilters: modListFiltersReducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  })
}

const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>

export default store