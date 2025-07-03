import axios from 'axios';

const API_URL = '/api/v1/auth';

export async function login(username: string, password: string) {
  const res = await axios.post(`${API_URL}/login`, { username, password });
  return res.data;
}

export async function register(username: string, email: string, password: string) {
  const res = await axios.post(`${API_URL}/register`, { username, email, password });
  return res.data;
}

export async function getCurrentUser(token: string) {
  const res = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
} 