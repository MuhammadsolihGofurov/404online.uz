import { configureStore } from '@reduxjs/toolkit';
import paginationReducer from '../slice/pagination';

const store = configureStore({
    reducer: {
        pagination: paginationReducer,
    },
});

export default store;