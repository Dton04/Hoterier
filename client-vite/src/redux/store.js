import { configureStore, createSlice } from '@reduxjs/toolkit';

const loginUserSlice = createSlice({
  name: 'loginUser',
  initialState: {
    currentUser: JSON.parse(localStorage.getItem('userInfo')) || null
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
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