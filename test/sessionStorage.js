// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as storage from 'src/sessionStorage';

test('if getStorageData will get the storage data if it exists', (t) => {
  const key = 'key';
  const data = JSON.stringify({some: 'data'});

  const getStub = sinon.stub(window.sessionStorage, 'getItem').returns(data);

  const result = storage.getStorageData(key);

  t.true(getStub.calledOnce);
  t.true(getStub.calledWith(key));

  getStub.restore();

  t.deepEqual(result, JSON.parse(data));
});

test('if getStorageData will get null if data does not exist', (t) => {
  const key = 'key';

  const getStub = sinon.stub(window.sessionStorage, 'getItem').returns(null);

  const result = storage.getStorageData(key);

  t.true(getStub.calledOnce);
  t.true(getStub.calledWith(key));

  getStub.restore();

  t.deepEqual(result, null);
});

test('if removeStorageData will remove the item from storage', (t) => {
  const key = 'key';

  const removeStub = sinon.stub(window.sessionStorage, 'removeItem');

  storage.removeStorageData(key);

  t.true(removeStub.calledOnce);
  t.true(removeStub.calledWith(key));

  removeStub.restore();
});

test('if setStorageData will set the storage data', (t) => {
  const key = 'key';
  const data = {some: 'data'};

  const getStub = sinon.stub(window.sessionStorage, 'setItem');

  storage.setStorageData(key, data);

  t.true(getStub.calledOnce);
  t.true(getStub.calledWith(key, JSON.stringify(data)));

  getStub.restore();
});
