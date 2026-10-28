import { configureStore, createSlice } from '@reduxjs/toolkit';

const load = () => {
  try {
    return { user: JSON.parse(localStorage.getItem('user')), token: localStorage.getItem('token') };
  } catch {
    return { user: null, token: null };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: load(),
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('token', payload.token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer } });
