// test
import test from 'ava';
import sinon from 'sinon';

// src
import Tab from 'src/Tab';
import {
  DEFAULT_CONFIG,
  SESSION_STORAGE_KEY,
  TAB_STATUS
} from 'src/constants';
import * as storage from 'src/sessionStorage';

test('if the new tab instance has the correct properties', (t) => {
  window.name = '';

  const addEventListenerStub = sinon.stub(window, 'addEventListener');
  const removeStorageDataStub = sinon.stub(storage, 'removeStorageData');
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const result = new Tab({}, {});

  t.deepEqual(result.__children, []);
  t.deepEqual(result.config, DEFAULT_CONFIG);
  t.is(typeof result.created, 'number');
  t.regex(result.id, /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  t.is(result.lastCheckin, null);
  t.is(result.lastParentCheckin, null);
  t.is(result.parent, null);
  t.is(result.receivePingInterval, null);
  t.is(result.ref, window);
  t.is(result.sendPingInterval, null);
  t.is(result.status, TAB_STATUS.OPEN);
  t.is(result.windowName, `${SESSION_STORAGE_KEY}:ROOT`);

  t.true(addEventListenerStub.calledTwice);

  const [beforeUnload, message] = addEventListenerStub.args;

  t.is(beforeUnload[0], 'beforeunload');
  t.is(message[0], 'message');

  addEventListenerStub.restore();

  t.true(removeStorageDataStub.calledOnce);
  t.true(removeStorageDataStub.calledWith(result.windowName));

  removeStorageDataStub.restore();

  t.true(receivePingStub.calledOnce);

  receivePingStub.restore();

  t.true(sendPingStub.calledOnce);

  sendPingStub.restore();
});

test('if the new tab instance has the correct properties when additional stuff is passed', (t) => {
  window.name = 'TAB_TEST';

  const currentWindow = window;

  window = {...currentWindow};

  window.opener = currentWindow;

  const addEventListenerStub = sinon.stub(window, 'addEventListener');
  const addEventListenerStubParent = sinon.stub(currentWindow, 'addEventListener');
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const result = new Tab({}, {ref: window});

  t.deepEqual(result.__children, []);
  t.deepEqual(result.config, DEFAULT_CONFIG);
  t.is(typeof result.created, 'number');
  t.regex(result.id, /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  t.is(result.lastCheckin, null);
  t.is(result.lastParentCheckin, null);
  t.is(result.parent, currentWindow);
  t.is(result.receivePingInterval, null);
  t.is(result.ref, window);
  t.is(result.sendPingInterval, null);
  t.is(result.status, TAB_STATUS.OPEN);
  t.is(result.windowName, window.name);

  t.true(addEventListenerStub.calledTwice);

  const [beforeUnload, message] = addEventListenerStub.args;

  t.is(beforeUnload[0], 'beforeunload');
  t.is(message[0], 'message');
  t.is(message[1], result.__handleMessage);

  addEventListenerStub.restore();

  t.true(addEventListenerStubParent.calledOnce);

  const [beforeUnloadParent] = addEventListenerStubParent.args;

  t.is(beforeUnloadParent[0], 'beforeunload');

  addEventListenerStubParent.restore();

  t.true(receivePingStub.calledOnce);

  receivePingStub.restore();

  t.true(sendPingStub.calledOnce);

  sendPingStub.restore();

  window = currentWindow;
});

test('if the children getter returns a shallow clone of the children', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const tab = new Tab({}, {});

  tab.__children = [
    {
      id: 'foo',
      status: 'OPEN',
    },
    {
      id: 'bar',
      status: 'CLOSED',
    },
    {
      id: 'baz',
      status: 'OPEN',
    },
  ];

  const result = tab.children;

  t.not(result, tab.__children);
  t.deepEqual(result, tab.__children);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if the openChildren getter returns a shallow clone of the open children', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const tab = new Tab({}, {});

  tab.__children = [
    {
      id: 'foo',
      status: 'OPEN',
    },
    {
      id: 'bar',
      status: 'CLOSED',
    },
    {
      id: 'baz',
      status: 'OPEN',
    },
  ];

  const result = tab.openChildren;

  t.not(result, tab.__children);
  t.deepEqual(result, [tab.__children[0], tab.__children[2]]);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if the closedChildren getter returns a shallow clone of the closed children', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const tab = new Tab({}, {});

  tab.__children = [
    {
      id: 'foo',
      status: 'OPEN',
    },
    {
      id: 'bar',
      status: 'CLOSED',
    },
    {
      id: 'baz',
      status: 'OPEN',
    },
  ];

  const result = tab.closedChildren;

  t.not(result, tab.__children);
  t.deepEqual(result, [tab.__children[1]]);

  receivePingStub.restore();
  sendPingStub.restore();
});
