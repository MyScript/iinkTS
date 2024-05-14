import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { TExport } from 'iink-ts'

export interface ExportState
{
  value: TExport
}

const initialState: ExportState = {
  value: {}
}

export const exportsSlice = createSlice({
  name: 'exports',

  initialState,

  reducers: {
    setExports: (state, action: PayloadAction<TExport>) =>
    {
      Object.assign(state.value, action.payload)
    },
    clearExports: (state) =>
    {
      state.value = {}
    },
  },
})

export const { setExports, clearExports } = exportsSlice.actions

export default exportsSlice.reducer
