import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    currentTopic: {},
    notifications: [],
    partData: {},
  },
  reducers: {
    setTopicsData: (state, action) => {
      state.currentTopic = action.payload;
    },
    setNotificationsData: (state, action) => {
      state.notifications = action.payload;
    },
    setPartData: (state, action) => {
      state.partData = action.payload;
    },
  },
});

export const { setTopicsData, setNotificationsData, setPartData } =
  settingsSlice.actions;

export default settingsSlice.reducer;
