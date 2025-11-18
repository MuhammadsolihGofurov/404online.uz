import { configureStore } from "@reduxjs/toolkit";
import paginationReducer from "../slice/pagination";
import settingsReducer from "../slice/settings";

const store = configureStore({
  reducer: {
    pagination: paginationReducer,
    settings: settingsReducer,
  },
});

export default store;
