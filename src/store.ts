import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import recipeReducer from './features/recipes/recipeSlice'
import { recipeApi } from './services/recipeApi'

export const createStore = () =>
  configureStore({
    reducer: {
      recipe: recipeReducer,
      [recipeApi.reducerPath]: recipeApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: [recipeApi.reducerPath],
        },
      }).concat(recipeApi.middleware),
  })

export const store = createStore()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
