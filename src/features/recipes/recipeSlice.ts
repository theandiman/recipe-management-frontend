import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
import type { Recipe } from '../../types/nutrition'
import { buildApiUrl } from '../../utils/apiUtils'
import { postWithAuth } from '../../utils/authApi'

export const generateRecipe = createAsyncThunk(
  'recipe/generate',
  async (payload: { 
    prompt: string; 
    pantryItems: string[]; 
    units?: string; 
    dietaryPreferences?: string[]; 
    allergies?: string[]; 
    maxTotalMinutes?: number | null 
  }, { rejectWithValue }) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const url = buildApiUrl(apiBase, '/api/recipes/generate')
      const res = await postWithAuth(url, payload)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data
        if (typeof data === 'string') return rejectWithValue(data)
        try {
          return rejectWithValue(JSON.stringify(data))
        } catch {
          return rejectWithValue(String(data))
        }
      }
      return rejectWithValue((err as Error).message ?? 'Failed to generate recipe')
    }
  }
)

export const generateImage = createAsyncThunk(
  'recipe/generateImage',
  async (payload: { prompt?: string; recipe?: Recipe }, { rejectWithValue, signal }) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const url = buildApiUrl(apiBase, '/api/recipes/image/generate')
      const res = await postWithAuth(url, payload, { signal })
      return res.data
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue('cancelled')
      }
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data
        if (typeof data === 'string') return rejectWithValue(data)
        try {
          return rejectWithValue(JSON.stringify(data))
        } catch {
          return rejectWithValue(String(data))
        }
      }
      return rejectWithValue((err as Error).message ?? 'Failed to generate image')
    }
  }
)

interface RecipeState {
  loading: boolean
  result: string | null
  error: string | null
  imageUrl: string | null
  imageLoading: boolean
  imageError: string | null
}

const initialState: RecipeState = { 
  loading: false, 
  result: null, 
  error: null,
  imageUrl: null,
  imageLoading: false,
  imageError: null
}

const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    clearRecipe(state) {
      state.result = null
      state.error = null
      state.loading = false
      state.imageUrl = null
      state.imageLoading = false
      state.imageError = null
    },
    clearImage(state) {
      state.imageUrl = null
      state.imageLoading = false
      state.imageError = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateRecipe.pending, (state) => {
        state.loading = true
        state.error = null
        state.imageUrl = null
        state.imageError = null
        state.imageLoading = false
      })
      .addCase(generateRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.result = typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload)
        state.error = null
      })
      .addCase(generateRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? action.error?.message ?? 'Failed to generate recipe'
      })
      .addCase(generateImage.pending, (state) => {
        state.imageLoading = true
        state.imageError = null
      })
      .addCase(generateImage.fulfilled, (state, action) => {
        state.imageLoading = false
        const data = action.payload || {}
        state.imageUrl = data.imageUrl || data.image || null
        state.imageError = null
      })
      .addCase(generateImage.rejected, (state, action) => {
        state.imageLoading = false
        if (action.payload === 'cancelled') {
          state.imageError = null
        } else {
          state.imageError = (action.payload as string) ?? action.error?.message ?? 'Failed to generate image'
        }
      })
  }
})

export const { clearRecipe, clearImage } = recipeSlice.actions
export default recipeSlice.reducer
