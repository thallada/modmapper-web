import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"

import pluginsReducer from "../slices/plugins"
import pluginsTxtReducer from "../slices/pluginsTxt"

export function makeStore() {
  return configureStore({
    reducer: { pluginsTxt: pluginsTxtReducer, plugins: pluginsReducer },
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