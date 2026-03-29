
import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
	baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('authToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;
