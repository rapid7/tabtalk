// external dependencies
import {call} from 'unchanged';

// constants
import {HAS_SESSION_STORAGE} from './constants';

export const getStorageData = (key) => {
  if (!HAS_SESSION_STORAGE) {
    return null;
  }

  const data = call(['getItem'], [key], window.sessionStorage);

  return data ? JSON.parse(data) : null;
};

export const removeStorageData = (key) => call(['removeItem'], [key], window.sessionStorage);

export const setStorageData = (key, data) => call(['setItem'], [key, JSON.stringify(data)], window.sessionStorage);
