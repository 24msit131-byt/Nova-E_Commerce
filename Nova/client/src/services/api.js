
import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const pendingGetRequests = new Map();

const buildRequestKey = (config) => {
  const method = String(config.method || 'get').toLowerCase();
  const url = [config.baseURL || apiBaseURL, config.url || ''].join('');
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}?${params}`;
};

const cancelPendingGetRequests = () => {
  pendingGetRequests.forEach((controller) => {
    controller.abort();
  });
  pendingGetRequests.clear();
};

const api = axios.create({
	baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('authToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	const method = String(config.method || 'get').toLowerCase();

	if (method === 'get') {
		const requestKey = buildRequestKey(config);
		const previousController = pendingGetRequests.get(requestKey);

		if (previousController) {
			previousController.abort();
		}

		const controller = new AbortController();
		pendingGetRequests.set(requestKey, controller);
		config.signal = controller.signal;
		config.metadata = { ...(config.metadata || {}), requestKey };
	}

	return config;
});

api.interceptors.response.use(
	(response) => {
		const requestKey = response.config?.metadata?.requestKey;
		if (requestKey) {
			pendingGetRequests.delete(requestKey);
		}
		return response;
	},
	(error) => {
		const requestKey = error.config?.metadata?.requestKey;
		if (requestKey) {
			pendingGetRequests.delete(requestKey);
		}
		return Promise.reject(error);
	}
);

export { cancelPendingGetRequests };
export default api;
