// src/config/index.ts

// Use Vite's built-in environment variable to determine the mode.
const isProduction = import.meta.env.PROD;

export const API_BASE_URL = isProduction
    ? 'https://skating-management.onrender.com/api'
    : 'http://localhost:5000/api';
