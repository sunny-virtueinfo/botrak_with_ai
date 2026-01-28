import axios from 'axios';
import { showToast } from '../utility/toastRef';

// Utility function for common headers
const header = () => ({
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Axios Interceptors
axios.interceptors.request.use(
  request => {
    const { params } = request;
    request.params = { ...params, from_mobile: true };

    console.log('------------------------------------------------');
    console.log('------------httpClient-------------');
    console.log('------------------------------------------------');
    console.log('Url : ', request.url);
    console.log('method : ', request.method);
    console.log('Headers : ', request.headers);
    console.log('Params : ', request.params);
    console.log('data : ', request.data);

    console.log('------------------------------------------------');
    return request;
  },
  error => Promise.reject(error),
);

axios.interceptors.response.use(
  response => response, // Pass successful responses
  error => {
    console.log('---------------Response---Error-------------------');
    console.log('Error : ', error?.message);
    const requestConfig = error?.config;
    console.log('Url : ', requestConfig.url);
    console.log('method : ', requestConfig.method);
    console.log('Headers : ', requestConfig.headers);
    console.log('Params : ', requestConfig.params);
    console.log('------------------------------------------------');
    if (!error.response) {
      showToast('No internet connection, please try again later.');
    } else {
      //  ToastMessage('Something went wrong, please try again.');
    }
    return Promise.reject(error);
  },
);

const baseUrl = 'https://botrak.virtueinfo.com/api';
axios.defaults.baseURL = baseUrl;

// HTTP Methods

// POST request
// POST request
const post = (url, data, config = {}) => {
  const defaultHeaders = header().headers;
  const mergedHeaders = { ...defaultHeaders, ...config.headers };

  console.log('---------------------------');
  console.log('POST:', url);
  console.log('Data:', JSON.stringify(data));
  console.log('Config:', JSON.stringify(config));

  return axios.post(url, data, {
    ...config,
    headers: mergedHeaders,
  });
};

// GET request
// GET request
const get = (url, config = {}) => {
  const defaultHeaders = header().headers;
  const mergedHeaders = { ...defaultHeaders, ...config.headers };

  // If ApiService passes data as params in config, it's already there.
  return axios.get(url, {
    ...config,
    headers: mergedHeaders,
  });
};

// PUT request
// PUT request
const put = (url, data, config = {}) => {
  const defaultHeaders = header().headers;
  const mergedHeaders = { ...defaultHeaders, ...config.headers };

  return axios.put(url, data, {
    ...config,
    headers: mergedHeaders,
  });
};

// DELETE request
// DELETE request
const del = (url, config = {}) => {
  const defaultHeaders = header().headers;
  const mergedHeaders = { ...defaultHeaders, ...config.headers };

  return axios.delete(url, {
    ...config,
    headers: mergedHeaders,
  });
};

// PUT request with multipart form data
// PUT request with multipart form data
const putMultipart = (url, data, config = {}) => {
  const defaultHeaders = header().headers;
  const mergedHeaders = { ...defaultHeaders, ...config.headers };

  // Content-Type multipart/form-data is usually set automatically by axios when data is FormData
  // But we can force it if needed, or let user set it.
  mergedHeaders['Content-Type'] = 'multipart/form-data';

  return axios.put(url, data, {
    ...config,
    headers: mergedHeaders,
  });
};

// Encapsulating all methods in an HttpClient object
const HttpClient = {
  post,
  get,
  put,
  delete: del,
  baseUrl,
  putMultipart,
  defaults: axios.defaults, // Expose defaults for AuthContext
};

export { HttpClient };
export default HttpClient;
