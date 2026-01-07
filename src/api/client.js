import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remote backend URL
const BASE_URL = 'https://botrak.virtueinfo.com/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Token handling is handled manually in ApiService.js now.
// No interceptor needed.

export default client;
