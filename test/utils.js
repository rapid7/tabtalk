// test
import test from 'ava';

// src
import * as utils from 'src/utils';
import {SESSION_STORAGE_KEY} from 'src/constants';

test('if map will perform the same function as the native map', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const fn = (value) => value * value;

  const result = utils.map(fn, array);

  t.deepEqual(result, array.map(fn));
});

test('if filter will perform the same function as the native filter', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const fn = (value) => value % 2 === 0;

  const result = utils.filter(fn, array);

  t.deepEqual(result, array.filter(fn));
});

test('if reduce will perform the same function as the native reduce', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const fn = (sum, value) => sum + value;

  const result = utils.reduce(fn, 0, array);

  t.deepEqual(result, array.reduce(fn, 0));
});

test('if assign will perform the same function as the native assign', (t) => {
  const source1 = {foo: 'bar'};
  const source2 = undefined;
  const source3 = {baz: 'quz'};
  const target = {};

  const result = utils.assign(target, source1, source2, source3);

  t.deepEqual(result, Object.assign(target, source1, source2, source3));
});

test('if find will perform the same function as the native find', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const fn = (value) => value % 2 === 0;

  const result = utils.find(fn, array);

  t.deepEqual(result, array.find(fn));
});

test('if findChildTab will find the correct child tab', (t) => {
  const children = [{id: 'foo'}, {id: 'bar'}, {id: 'baz'}];
  const {id} = children[1];

  const result = utils.findChildTab(children, id);

  t.is(result, children[1]);
});

test('if getChildWindowName will compile the windowName correctly', (t) => {
  const childId = 'childId';
  const parentId = 'parentId';

  const result = utils.getChildWindowName(childId, parentId);

  t.is(result, `${SESSION_STORAGE_KEY}:CHILD_${childId}_OF_${parentId}`);
});
