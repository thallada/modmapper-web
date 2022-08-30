import LogRocket from "logrocket"
import * as Sentry from "@sentry/react";
import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"

import pluginsReducer from "../slices/plugins"
import pluginsTxtReducer from "../slices/pluginsTxt"
import modListFiltersReducer from "../slices/modListFilters"

const sentryReduxEnhancer = Sentry.createReduxEnhancer();

export function makeStore() {
  return configureStore({
    reducer: { pluginsTxt: pluginsTxtReducer, plugins: pluginsReducer, modListFilters: modListFiltersReducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(LogRocket.reduxMiddleware()),
    enhancers: [sentryReduxEnhancer],
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