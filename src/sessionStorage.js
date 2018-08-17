// external dependencies
import {call} from 'unchanged';

/**
 * @function getStorageData
 *
 * @description
 * get the data in sessionStorage for the given key
 *
 * @param {string} key the key to get the data for
 * @returns {any} the stored data
 */
export const getStorageData = (key) => {
  const data = call(['getItem'], [key], window.sessionStorage);

  return data ? JSON.parse(data) : null;
};

/**
 * @function removeStorageData
 *
 * @description
 * remove the given key from sessionStorage
 *
 * @param {string} key the key to remove from storage
 * @returns {void}
 */
export const removeStorageData = (key) => call(['removeItem'], [key], window.sessionStorage);

/**
 * @function setStorageData
 *
 * @description
 * set the data in sessionStorage for the given key
 *
 * @param {string} key the key to set the data for
 * @param {any} data the data to set
 * @returns {void}
 */
export const setStorageData = (key, data) => call(['setItem'], [key, JSON.stringify(data)], window.sessionStorage);
