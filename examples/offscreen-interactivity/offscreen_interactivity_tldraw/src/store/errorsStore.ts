import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ErrorState
{
  value: string[]
}

const initialState: ErrorState = {
  value: []
}

export const errorsSlice = createSlice({
  name: 'errors',

  initialState,

  reducers: {
    addError: (state, action: PayloadAction<string>) =>
    {
      state.value.push(action.payload)
    },
    removeError: (state, action: PayloadAction<string>) =>
    {
      const index = state.value.findIndex(s => s === action.payload)
      if (index > -1) {
        state.value.splice(index, 1)
      }
    },
  },
})

export const { addError, removeError } = errorsSlice.actions

export default errorsSlice.reducer
