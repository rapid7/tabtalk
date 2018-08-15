// constants
import {
  HAS_SESSION_STORAGE,
  SESSION_STORAGE_KEY
} from './constants';

export const getStorageData = () => {
  if (!HAS_SESSION_STORAGE) {
    return null;
  }

  const data = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  return data ? JSON.parse(data) : null;
};

export const setStorageData = (data) =>
  HAS_SESSION_STORAGE ? window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data)) : null;
