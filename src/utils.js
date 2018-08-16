// constants
import {SESSION_STORAGE_KEY} from './constants';

export const assign = (target, ...sources) =>
  sources.reduce(
    (assigned, source) =>
      Object.keys(source).reduce((assigned, key) => {
        assigned[key] = source[key];

        return assigned;
      }, assigned),
    target
  );

export const find = (fn, array) => {
  for (let index = 0; index < array.length; index++) {
    if (fn(array[index], index, array)) {
      return array[index];
    }
  }
};

export const getChildWindowName = (childId, id) => `${SESSION_STORAGE_KEY}:CHILD_${childId}_OF_${id}`;
