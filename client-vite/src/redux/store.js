import { configureStore, createSlice } from '@reduxjs/toolkit';

const loginUserSlice = createSlice({
  name: 'loginUser',
  initialState: {
    currentUser: (() => {
      try {
        const raw = localStorage.getItem('userInfo');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.user || parsed || null;
      } catch {
        return null;
      }
    })()
  },
  reducers: {
    setUser: (state, action) => {
      const normalized = action.payload?.user || action.payload;
      state.currentUser = normalized;
      localStorage.setItem('userInfo', JSON.stringify(normalized));
    },
    clearUser: (state) => {
      state.currentUser = null;
      localStorage.removeItem('userInfo');
    }
  }
});

// Export actions
export const { setUser, clearUser } = loginUserSlice.actions;

// Configure store
const store = configureStore({
  reducer: {
    loginUserReducer: loginUserSlice.reducer
  }
});

export default store;
