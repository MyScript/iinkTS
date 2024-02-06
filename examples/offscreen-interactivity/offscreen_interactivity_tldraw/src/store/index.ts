import { configureStore } from '@reduxjs/toolkit'
import exports from './exportsStore'
import errors from './errorsStore'

export const store = configureStore({
  reducer: {
    exports,
    errors,
  },
})


export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
