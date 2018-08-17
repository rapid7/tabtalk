// constants
import {SESSION_STORAGE_KEY} from './constants';

/**
 * @function map
 *
 * @description
 * map the array based on returns from calling fn
 *
 * @param {function} fn the function to get mapped value from
 * @param {Array<any>} array the array to iterate over
 * @returns {any} the mapped value
 */
export const map = (fn, array) => {
  let mapped = new Array(array.length);

  for (let index = 0; index < array.length; index++) {
    mapped[index] = fn(array[index], index, array);
  }

  return mapped;
};

/**
 * @function filter
 *
 * @description
 * filter the array based on truthy returns from calling fn
 *
 * @param {function} fn the function that filters the array based on calling fn with each iteration
 * @param {Array<any>} array the array to filter
 * @returns {Array<any>} the filtered array
 */
export const filter = (fn, array) => {
  let filtered = [],
      result;

  for (let index = 0; index < array.length; index++) {
    result = fn(array[index], index, array);

    if (result) {
      filtered.push(array[index]);
    }
  }

  return filtered;
};

/**
 * @function reduce
 *
 * @description
 * reduce the values in array to a single value based on calling fn with each iteration
 *
 * @param {function} fn the function that reduces each iteration to a value
 * @param {any} initialValue the initial value of the reduction
 * @param {Array<any>} array the array to reduce
 * @returns {any} the reduced value
 */
export const reduce = (fn, initialValue, array) => {
  let value = initialValue;

  for (let index = 0; index < array.length; index++) {
    value = fn(value, array[index], index, array);
  }

  return value;
};

/**
 * @function assign
 *
 * @description
 * shallowly merge the sources into the target
 *
 * @param {Object} target the target object to assign into
 * @param  {...any} sources the sources to assign into the target
 * @returns {Object} the shallowly-merged object
 */
export const assign = (target, ...sources) =>
  reduce(
    (assigned, source) =>
      source
        ? reduce(
          (assigned, key) => {
            assigned[key] = source[key];

            return assigned;
          },
          assigned,
          Object.keys(source)
        )
        : assigned,
    target,
    sources
  );

/**
 * @function find
 *
 * @description
 * find an item in the array based on matching with fn
 *
 * @param {function} fn the function to get the match with
 * @param {Array<any>} array the array to iterate over
 * @returns {any} the matching value
 */
export const find = (fn, array) => {
  for (let index = 0; index < array.length; index++) {
    if (fn(array[index], index, array)) {
      return array[index];
    }
  }
};

/**
 * @function findChildTab
 *
 * @description
 * find the child tab in the children
 *
 * @param {Array<Tab>} children the children of the tab
 * @param {string} id the id of the child to find
 * @returns {Tab} the matching child tab
 */
export const findChildTab = (children, id) => find(({id: childId}) => childId === id, children);

/**
 * @function getChildWindowName
 *
 * @description
 * build the name of the child window based on it and its parent
 *
 * @param {string} childId the child id
 * @param {string} parentId the parent id
 * @returns {string} the child window name
 */
export const getChildWindowName = (childId, parentId) => `${SESSION_STORAGE_KEY}:CHILD_${childId}_OF_${parentId}`;
