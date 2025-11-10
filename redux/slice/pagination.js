import { createSlice } from '@reduxjs/toolkit';

const paginationSlice = createSlice({
    name: 'pagination',
    initialState: {
        currentPage: 1,
        totalPageCount: null,
    },
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setTotalPageCount: (state, action) => {
            state.totalPageCount = action.payload;
        },
    },
});

export const { setCurrentPage, setTotalPageCount } = paginationSlice.actions;

export default paginationSlice.reducer;
