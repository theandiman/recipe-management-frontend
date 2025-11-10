import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { auth } from '../config/firebase'

async function getIdToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken()
    }
  } catch (e) {
    console.warn('getIdToken failed', e)
  }
  return null
}

export async function postWithAuth(url: string, data: unknown, config: AxiosRequestConfig = {}) {
  const token = await getIdToken()
  const headers = {
    ...config.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  const merged = { ...config, headers }
  return axios.post(url, data, merged)
}

export async function fetchWithAuth(url: string, opts: RequestInit = {}) {
  const token = await getIdToken()
  const headers = {
    ...opts.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  const merged = { ...opts, headers }
  return fetch(url, merged)
}

export default { postWithAuth, fetchWithAuth }
