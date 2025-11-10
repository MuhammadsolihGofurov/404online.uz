import axios from 'axios'

export default axios.create({
    baseURL: process.env.API,
    headers: {
        Accept: 'application/json',
    },
})

export const authAxios = axios.create({
    baseURL: process.env.API,
    headers: {
        Accept: 'application/json',
    },
})
