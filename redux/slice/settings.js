import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    currentTopic: {},
    notifications: [],
  },
  reducers: {
    setTopicsData: (state, action) => {
      state.currentTopic = action.payload;
    },
    setNotificationsData: (state, action) => {
      state.notifications = action.payload;
    },
  },
});

export const { setTopicsData, setNotificationsData } = settingsSlice.actions;

export default settingsSlice.reducer;
