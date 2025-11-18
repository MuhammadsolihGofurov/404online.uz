import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    currentTopic: {},
  },
  reducers: {
    setTopicsData: (state, action) => {
      state.currentTopic = action.payload;
    },
  },
});

export const { setTopicsData } = settingsSlice.actions;

export default settingsSlice.reducer;
