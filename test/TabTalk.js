// test
import test from 'ava';
import {
  decrypt,
  encrypt
} from 'krip';
import sinon from 'sinon';

// src
import TabTalk from 'src/TabTalk';
import {
  DEFAULT_CONFIG,
  EVENT,
  SESSION_STORAGE_KEY,
  TAB_REFERENCE_KEY,
  TAB_STATUS
} from 'src/constants';
import * as storage from 'src/sessionStorage';

import * as utils from 'src/utils';

test('if the new tab instance has the correct properties', (t) => {
  window.name = '';

  const addEventListenerStub = sinon.stub(window, 'addEventListener');
  const removeStorageDataStub = sinon.stub(storage, 'removeStorageData');
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const result = new TabTalk({}, {});

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
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const result = new TabTalk({}, {ref: window});

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
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const tab = new TabTalk({}, {});

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
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const tab = new TabTalk({}, {});

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
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const tab = new TabTalk({}, {});

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

test('if __addChild will add a new child to the internal children', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const tab = new TabTalk({}, {});

  const child = {id: 'foo'};

  tab.__addChild(child);

  t.deepEqual(tab.__children, [child]);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __addEventListeners will add the appropriate event listeners when there is a parent', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const addStub = sinon.stub(window, 'addEventListener');
  const setStorageStub = sinon.stub(storage, 'setStorageData');
  const clearStub = sinon.stub(TabTalk.prototype, '__clearPingIntervals');
  const parentStub = sinon.stub(TabTalk.prototype, '__sendToParent');

  const config = {
    onClose: sinon.spy(),
    onParentClose: sinon.spy(),
  };

  const currentOpener = window.opener;

  window.opener = {...window};

  const tab = new TabTalk(config, {});

  addStub.reset();
  clearStub.reset();
  parentStub.reset();

  tab.parent = window;

  tab.__addEventListeners();

  t.true(addStub.calledThrice);

  const [beforeUnload, message, beforeParentUnload] = addStub.args;

  t.is(beforeUnload[0], 'beforeunload');

  beforeUnload[1]();

  t.true(setStorageStub.calledOnce);
  t.true(setStorageStub.calledWith(tab.windowName, {id: tab.id}));

  setStorageStub.restore();

  t.true(clearStub.calledOnce);

  clearStub.restore();

  t.true(parentStub.calledOnce);
  t.true(parentStub.calledWith(EVENT.SET_TAB_STATUS, TAB_STATUS.CLOSED));

  parentStub.restore();

  t.true(config.onClose.calledOnce);

  t.deepEqual(message, ['message', tab.__handleMessage]);

  t.is(beforeParentUnload[0], 'beforeunload');

  beforeParentUnload[1]();

  t.true(config.onParentClose.calledOnce);

  addStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();

  window.opener = currentOpener;
});

test.serial('if __addEventListeners will add the appropriate event listeners when there is no parent', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const addStub = sinon.stub(window, 'addEventListener');
  const setStorageStub = sinon.stub(storage, 'setStorageData');
  const clearStub = sinon.stub(TabTalk.prototype, '__clearPingIntervals');
  const parentStub = sinon.stub(TabTalk.prototype, '__sendToParent');

  const config = {
    onClose: sinon.spy(),
    onParentClose: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  addStub.reset();
  clearStub.reset();
  parentStub.reset();

  tab.__addEventListeners();

  t.true(addStub.calledTwice);

  const [beforeUnload, message] = addStub.args;

  t.is(beforeUnload[0], 'beforeunload');

  beforeUnload[1]();

  t.true(setStorageStub.calledOnce);
  t.true(setStorageStub.calledWith(tab.windowName, {id: tab.id}));

  setStorageStub.restore();

  t.true(clearStub.calledOnce);

  clearStub.restore();

  t.true(parentStub.notCalled);

  parentStub.restore();

  t.true(config.onClose.calledOnce);

  t.deepEqual(message, ['message', tab.__handleMessage]);

  t.true(config.onParentClose.notCalled);

  addStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __clearPingIntervals will clear the intervals for both send and receive', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const clearStub = sinon.stub(global, 'clearInterval');

  const config = {};

  const tab = new TabTalk(config, {});

  clearStub.reset();

  tab.receivePingInterval = 123;
  tab.sendPingInterval = 234;

  tab.__clearPingIntervals();

  t.true(clearStub.calledTwice);
  t.deepEqual(clearStub.args, [[tab.receivePingInterval], [tab.sendPingInterval]]);

  clearStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleOnChildCommunicationMessage will call onChildCommunication if there is a child', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onChildCommunication: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  const payload = {
    child: 'child',
    data: 'data',
  };

  tab.__handleOnChildCommunicationMessage(payload);

  t.true(config.onChildCommunication.calledOnce);

  const [data, time] = config.onChildCommunication.args[0];

  t.is(data, payload.data);
  t.is(typeof time, 'number');

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleOnChildCommunicationMessage will not call onChildCommunication if there is no child', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onChildCommunication: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  const payload = {
    child: null,
    data: 'data',
  };

  tab.__handleOnChildCommunicationMessage(payload);

  t.true(config.onChildCommunication.notCalled);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleOnParentCommunicationMessage will call onParentCommunication if the childId matches', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onParentCommunication: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  const payload = {
    childId: tab.id,
    data: 'data',
  };

  tab.__handleOnParentCommunicationMessage(payload);

  t.true(config.onParentCommunication.calledOnce);

  const [data, time] = config.onParentCommunication.args[0];

  t.is(data, payload.data);
  t.is(typeof time, 'number');

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleOnParentCommunicationMessage will not call onParentCommunication if the childId does not match', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onParentCommunication: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  const payload = {
    childId: 'blah',
    data: 'data',
  };

  tab.__handleOnParentCommunicationMessage(payload);

  t.true(config.onParentCommunication.notCalled);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handlePingChildMessage will set the lastParentCheckin value if the childId matches', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  const payload = {
    childId: tab.id,
    data: 12345,
  };

  tab.__handlePingChildMessage(payload);

  t.is(tab.lastParentCheckin, payload.data);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handlePingChildMessage will not call onParentCommunication if the childId does not match', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  const payload = {
    childId: 'blah',
    data: 12345,
  };

  tab.__handlePingChildMessage(payload);

  t.is(tab.lastParentCheckin, null);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handlePingParentOrRegisterMessage will set the lastCheckin of the existing child', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onChildRegister: sinon.spy(),
  };

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {
    ref: tab.ref,
    windowName: 'child',
  });

  const payload = {
    child,
    id: child.id,
    lastCheckin: Date.now(),
    source: child.ref,
  };

  const result = tab.__handlePingParentOrRegisterMessage(payload);

  t.is(child.lastCheckin, payload.lastCheckin);
  t.is(result, child);

  t.true(config.onChildRegister.notCalled);

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handlePingParentOrRegisterMessage will create and add a child before setting the lastCheckin of the new child', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const addStub = sinon.stub(TabTalk.prototype, '__addChild');

  const config = {
    onChildRegister: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  const payload = {
    id: 'childId',
    lastCheckin: Date.now(),
    source: tab.ref,
  };

  const child = tab.__handlePingParentOrRegisterMessage(payload);

  t.true(addStub.calledOnce);
  t.true(addStub.calledWith(child));

  addStub.restore();

  t.is(child.lastCheckin, payload.lastCheckin);

  t.true(config.onChildRegister.calledOnce);
  t.true(config.onChildRegister.calledWith(child));

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleSetStatusMessage will set the status of the child', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {
    onChildClose: sinon.spy(),
  };

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    child,
    status: TAB_STATUS.CLOSED,
  };

  tab.__handleSetStatusMessage(payload);

  t.is(child.status, payload.status);

  t.true(config.onChildClose.calledOnce);
  t.true(config.onChildClose.calledWith(child));

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleSetStatusMessage will remove the child if closed and requested in the config', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {
    onChildClose: sinon.spy(),
    removeOnClosed: true,
  };

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    child,
    status: TAB_STATUS.CLOSED,
  };

  tab.__handleSetStatusMessage(payload);

  t.is(child.status, payload.status);

  t.true(config.onChildClose.calledOnce);
  t.true(config.onChildClose.calledWith(child));

  t.true(removeStub.calledOnce);
  t.true(removeStub.calledWith(child));

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleSetStatusMessage will not call close methods when the status is set to open', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {
    onChildClose: sinon.spy(),
    removeOnClosed: true,
  };

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  child.status = TAB_STATUS.CLOSED;

  tab.__addChild(child);

  const payload = {
    child,
    status: TAB_STATUS.OPEN,
  };

  tab.__handleSetStatusMessage(payload);

  t.is(child.status, payload.status);

  t.true(config.onChildClose.notCalled);

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __handleSetStatusMessage will do nothing if no child is passed', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {
    onChildClose: sinon.spy(),
    removeOnClosed: true,
  };

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    child: null,
    status: TAB_STATUS.CLOSED,
  };

  tab.__handleSetStatusMessage(payload);

  t.true(config.onChildClose.notCalled);

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the PING_CHILD event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});

  console.log(tab.config.encryptionKey);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.PING_CHILD,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.calledOnce);
  t.true(pingChildStub.calledWith(rawData));

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the PING_PARENT event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.PING_PARENT,
      id: child.id,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.calledOnce);
  t.true(pingParentStub.calledWith({
    child,
    id: JSON.parse(payload.data).id,
    lastCheckin: rawData,
    source: payload.source,
  }));

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the REGISTER event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.REGISTER,
      id: child.id,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.calledOnce);
  t.true(pingParentStub.calledWith({
    child,
    id: JSON.parse(payload.data).id,
    lastCheckin: rawData,
    source: payload.source,
  }));

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the SET_STATUS event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.SET_TAB_STATUS,
      id: child.id,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.calledOnce);
  t.true(setStatusStub.calledWith({
    child,
    status: rawData,
  }));

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the CHILD_COMMUNICATION event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.CHILD_COMMUNICATION,
      id: child.id,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.calledOnce);
  t.true(childCommunicationStub.calledWith({
    child,
    data: rawData,
  }));

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will call the correct handler when the PARENT_COMMUNICATION event is sent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const rawData = 'data';
  const data = await encrypt(rawData, tab.config.encryptionKey);

  const payload = {
    data: JSON.stringify({
      data,
      event: EVENT.PARENT_COMMUNICATION,
      id: child.id,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.calledOnce);
  t.true(parentCommunicationStub.calledWith(rawData));

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will do nothing if the origin does not match', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    data: 'data',
    origin: 'maliciousOrigin',
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will do nothing if the event is not in the event data', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    data: 'data',
    origin: tab.config.orgin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage will do nothing if the event is not valid', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});
  const child = new TabTalk(config, {windowName: 'child'});

  tab.__addChild(child);

  const payload = {
    data: JSON.stringify({
      event: 'maliciousEvent',
    }),
    origin: tab.config.orgin,
    source: tab.ref,
  };

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __handleMessage handle the decryption rejection by logging in console', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const pingChildStub = sinon.stub(TabTalk.prototype, '__handlePingChildMessage');
  const pingParentStub = sinon.stub(TabTalk.prototype, '__handlePingParentOrRegisterMessage');
  const setStatusStub = sinon.stub(TabTalk.prototype, '__handleSetStatusMessage');
  const childCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnChildCommunicationMessage');
  const parentCommunicationStub = sinon.stub(TabTalk.prototype, '__handleOnParentCommunicationMessage');

  const config = {};

  const tab = new TabTalk(config, {});

  const payload = {
    data: JSON.stringify({
      data: 'data',
      event: EVENT.PARENT_COMMUNICATION,
    }),
    origin: tab.config.origin,
    source: tab.ref,
  };

  const consoleStub = sinon.stub(console, 'error');

  await tab.__handleMessage(payload);

  t.true(pingChildStub.notCalled);

  t.true(pingParentStub.notCalled);

  t.true(setStatusStub.notCalled);

  t.true(childCommunicationStub.notCalled);

  t.true(parentCommunicationStub.notCalled);

  pingChildStub.restore();
  pingParentStub.restore();
  setStatusStub.restore();
  childCommunicationStub.restore();
  parentCommunicationStub.restore();

  t.true(consoleStub.calledOnce);

  consoleStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __register will call onRegister in the config', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onRegister: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  config.onRegister.resetHistory();

  tab.__register();

  t.true(config.onRegister.calledOnce);
  t.true(config.onRegister.calledWith(tab));

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __register will call __sendToParent if there is a parent', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToParent');

  const config = {
    onRegister: sinon.spy(),
  };

  const tab = new TabTalk(config, {});

  tab.parent = 'parent';

  sendStub.reset();
  config.onRegister.resetHistory();

  tab.__register();

  t.true(sendStub.calledTwice);

  const [[registerEvent, registerTime], [statusEvent, status]] = sendStub.args;

  t.is(registerEvent, EVENT.REGISTER);
  t.regex(`${registerTime}`, /[0-9]/);

  t.is(statusEvent, EVENT.SET_TAB_STATUS);
  t.is(status, TAB_STATUS.OPEN);

  t.true(config.onRegister.calledOnce);
  t.true(config.onRegister.calledWith(tab));

  receivePingStub.restore();
  sendPingStub.restore();
  sendStub.restore();
});

test('if __removeChild will remove the child from the internal children', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  const child = {some: 'child'};

  tab.__children.push(child);

  t.deepEqual(tab.__children, [child]);

  tab.__removeChild(child);

  t.deepEqual(tab.__children, []);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will send the encrypted message to the child via postMessage', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      ref: {
        postMessage: sinon.spy(),
      },
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const id = tab.__children[0].id;
  const event = EVENT.PING_CHILD;
  const data = 'data';

  await tab.__sendToChild(id, event, data);

  t.true(tab.__children[0].ref.postMessage.calledOnce);

  const [message, origin] = tab.__children[0].ref.postMessage.args[0];

  const parsedMessage = JSON.parse(message);

  const decryptedData = await decrypt(parsedMessage.data, tab.config.encryptionKey);

  t.deepEqual(decryptedData, {
    childId: id,
    data,
  });
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will send the encrypted message to the child via postMessage with defaults', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      ref: {
        postMessage: sinon.spy(),
      },
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const id = tab.__children[0].id;
  const event = EVENT.PING_CHILD;

  await tab.__sendToChild(id, event);

  t.true(tab.__children[0].ref.postMessage.calledOnce);

  const [message, origin] = tab.__children[0].ref.postMessage.args[0];

  const parsedMessage = JSON.parse(message);

  const decryptedData = await decrypt(parsedMessage.data, tab.config.encryptionKey);

  t.deepEqual(decryptedData, {
    childId: id,
    data: null,
  });
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will reject if no child is found', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [];

  const id = 'id';
  const event = EVENT.PING_CHILD;
  const data = 'data';

  try {
    await tab.__sendToChild(id, event, data);

    t.is(error.message, 'Child could not be found.');
  } catch (error) {
    t.pass(error);
  }

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will reject if no child is found', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      ref: {
        postMessage: sinon.spy(),
      },
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const id = tab.__children[1].id;
  const event = EVENT.PING_CHILD;
  const data = 'data';

  try {
    await tab.__sendToChild(id, event, data);

    t.fail('Should reject');
  } catch (error) {
    t.is(error.message, 'TabTalk is closed.');
  }

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChildren will iterate over the open children and call __sendToChild', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChild').resolves();

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const event = EVENT.PING_CHILD;
  const data = 'data';

  const result = await tab.__sendToChildren(event, data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(tab.__children[0].id, event, data));

  t.is(result.length, 1);

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChildren will iterate over the open children and call __sendToChild with defaults', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChild').resolves();

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const event = EVENT.PING_CHILD;

  const result = await tab.__sendToChildren(event);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(tab.__children[0].id, event, null));

  t.is(result.length, 1);

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToParent will send the encrypted message to the parent via postMessage', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  tab.parent = {
    postMessage: sinon.spy(),
  };

  const event = EVENT.PING_PARENT;
  const data = 'data';

  await tab.__sendToParent(event, data);

  t.true(tab.parent.postMessage.calledOnce);

  const [message, origin] = tab.parent.postMessage.args[0];

  const parsedMessage = JSON.parse(message);

  const decryptedData = await decrypt(parsedMessage.data, tab.config.encryptionKey);

  t.deepEqual(decryptedData, data);
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToParent will send the encrypted message to the parent via postMessage with defaults', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  tab.parent = {
    postMessage: sinon.spy(),
  };

  const event = EVENT.PING_PARENT;

  await tab.__sendToParent(event);

  t.true(tab.parent.postMessage.calledOnce);

  const [message, origin] = tab.parent.postMessage.args[0];

  const parsedMessage = JSON.parse(message);

  const decryptedData = await decrypt(parsedMessage.data, tab.config.encryptionKey);

  t.deepEqual(decryptedData, null);
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToParent will reject if there is no parent', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  const event = EVENT.PING_PARENT;
  const data = 'data';

  try {
    await tab.__sendToParent(event, data);

    t.fail('Should reject');
  } catch (error) {
    t.is(error.message, 'Parent could not be found.');
  }

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __setReceivePingInterval will set the interval to set the tab status to closed if timed out', (t) => {
  const receivePingInterval = 123;

  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(receivePingInterval);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      lastCheckin: 123456789000,
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'foo',
      lastCheckin: Date.now() + tab.config.pingInterval,
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];

  receivePingStub.restore();

  const clearIntervalStub = sinon.stub(global, 'clearInterval');
  const setIntervalStub = sinon.stub(global, 'setInterval').returns(receivePingInterval);

  tab.__setReceivePingInterval();

  t.true(clearIntervalStub.calledOnce);

  clearIntervalStub.restore();

  t.true(setIntervalStub.calledOnce);

  const [fn, interval] = setIntervalStub.args[0];

  fn();

  t.is(tab.openChildren.length, 1);

  setIntervalStub.restore();

  t.is(interval, tab.config.pingInterval);

  sendPingStub.restore();
});

test('if __setSendPingInterval will set the interval to notify parent and children', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const sendParentStub = sinon.stub(TabTalk.prototype, '__sendToParent');
  const sendChildrenStub = sinon.stub(TabTalk.prototype, '__sendToChildren');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [
    {
      id: 'foo',
      lastCheckin: 123456789000,
      status: TAB_STATUS.OPEN,
    },
    {
      id: 'bar',
      status: TAB_STATUS.CLOSED,
    },
  ];
  tab.parent = {};

  sendPingStub.restore();

  const clearIntervalStub = sinon.stub(global, 'clearInterval');
  const setIntervalStub = sinon.stub(global, 'setInterval').returns(345);

  tab.__setSendPingInterval();

  t.true(clearIntervalStub.calledOnce);

  clearIntervalStub.restore();

  t.true(setIntervalStub.calledOnce);

  const [fn, interval] = setIntervalStub.args[0];

  fn();

  t.true(sendParentStub.calledOnce);
  t.true(sendParentStub.calledWith(EVENT.PING_PARENT, tab.lastCheckin));

  sendParentStub.restore();

  t.true(sendChildrenStub.calledOnce);
  t.true(sendChildrenStub.calledWith(EVENT.PING_CHILD, tab.lastCheckin));

  sendChildrenStub.restore();

  t.is(interval, tab.config.pingInterval);

  setIntervalStub.restore();

  receivePingStub.restore();
});

test('if __setSendPingInterval will set the interval to not notify anyone if no parent or children', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const sendParentStub = sinon.stub(TabTalk.prototype, '__sendToParent');
  const sendChildrenStub = sinon.stub(TabTalk.prototype, '__sendToChildren');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.__children = [];
  tab.parent = null;

  sendPingStub.restore();

  const clearIntervalStub = sinon.stub(global, 'clearInterval');
  const setIntervalStub = sinon.stub(global, 'setInterval').returns(345);

  tab.__setSendPingInterval();

  t.true(clearIntervalStub.calledOnce);

  clearIntervalStub.restore();

  t.true(setIntervalStub.calledOnce);

  const [fn, interval] = setIntervalStub.args[0];

  fn();

  t.true(sendParentStub.notCalled);

  sendParentStub.restore();

  t.true(sendChildrenStub.notCalled);

  sendChildrenStub.restore();

  t.is(interval, tab.config.pingInterval);

  setIntervalStub.restore();

  receivePingStub.restore();
});

test('if close will call close on the tab ref if no id is passed', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.ref.close = sinon.stub();

  const id = null;

  tab.close(id);

  t.true(tab.ref.close.calledOnce);

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if close will not close anything if no child is found based on the id', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.ref.close = sinon.stub();

  const child = new TabTalk(config, {windowName: 'child'});

  child.parent = tab.ref;
  child.ref.close = sinon.stub();

  tab.__children = [child];

  const id = 'otherId';

  tab.close(id);

  t.true(tab.ref.close.notCalled);

  t.true(removeStub.notCalled);

  t.true(child.ref.close.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if close will not close anything if the child found is already closed', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.ref.close = sinon.stub();

  const child = new TabTalk(config, {windowName: 'child'});

  child.parent = tab.ref;
  child.ref.close = sinon.stub();
  child.status = TAB_STATUS.CLOSED;

  tab.__children = [child];

  const id = tab.__children[0].id;

  tab.close(id);

  t.true(tab.ref.close.notCalled);

  t.true(child.ref.close.notCalled);

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if close will close the child if found and open', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {};

  const tab = new TabTalk(config, {});

  tab.ref.close = sinon.stub();

  const child = new TabTalk(config, {windowName: 'child'});

  child.parent = tab.ref;
  child.ref.close = sinon.stub();

  tab.__children = [child];

  const id = tab.__children[0].id;

  tab.close(id);

  t.true(tab.ref.close.calledOnce);

  t.true(child.ref.close.calledOnce);

  t.true(child.ref.close.calledOnce);

  t.is(child.status, TAB_STATUS.CLOSED);

  t.true(removeStub.notCalled);

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if close will close the child if found and open and remove if requested in the config', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const removeStub = sinon.stub(TabTalk.prototype, '__removeChild');

  const config = {
    removeOnClosed: true,
  };

  const tab = new TabTalk(config, {});

  tab.ref.close = sinon.stub();

  const child = new TabTalk(config, {windowName: 'child'});

  child.parent = tab.ref;
  child.ref.close = sinon.stub();

  tab.__children = [child];

  const id = tab.__children[0].id;

  tab.close(id);

  t.true(tab.ref.close.calledOnce);

  t.true(child.ref.close.calledOnce);

  t.true(child.ref.close.calledOnce);

  t.is(child.status, TAB_STATUS.CLOSED);

  t.true(removeStub.calledOnce);
  t.true(removeStub.calledWith(child));

  removeStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if open will open the window and add the child', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const childWindow = {
    name: '',
  };

  const windowOpenStub = sinon.stub(window, 'open').returns(childWindow);
  const addStub = sinon.stub(TabTalk.prototype, '__addChild');

  const config = {};

  const tab = new TabTalk(config, {});

  const openConfig = {
    config,
    url: 'http://www.example.com',
  };

  const child = await tab.open(openConfig);

  t.true(windowOpenStub.calledOnce);
  t.true(windowOpenStub.calledWith(openConfig.url, '_blank', openConfig.windowOptions));

  windowOpenStub.restore();

  t.is(childWindow[TAB_REFERENCE_KEY], child);
  t.is(childWindow.name, utils.getChildWindowName(child.id, tab.id));

  t.true(addStub.calledOnce);
  t.true(addStub.calledWith(child));

  addStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if open will open the window and add the child with defaults', async (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);

  const childWindow = {
    name: '',
  };

  const windowOpenStub = sinon.stub(window, 'open').returns(childWindow);
  const addStub = sinon.stub(TabTalk.prototype, '__addChild');

  const config = {};

  const tab = new TabTalk(config, {});

  const openConfig = {
    url: 'http://www.example.com',
  };

  const child = await tab.open(openConfig);

  t.true(windowOpenStub.calledOnce);
  t.true(windowOpenStub.calledWith(openConfig.url, '_blank', openConfig.windowOptions));

  windowOpenStub.restore();

  t.is(childWindow[TAB_REFERENCE_KEY], child);
  t.is(childWindow.name, utils.getChildWindowName(child.id, tab.id));

  t.true(addStub.calledOnce);
  t.true(addStub.calledWith(child));

  addStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToChild will call __sendToChild with the correct event', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChild');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  const id = 'id';
  const data = 'data';

  tab.sendToChild(id, data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(id, EVENT.PARENT_COMMUNICATION, data));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToChild will call __sendToChild with the correct event with defaults', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChild');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  const id = 'id';

  tab.sendToChild(id);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(id, EVENT.PARENT_COMMUNICATION, null));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToChildren will call __sendToChildren with the correct event', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChildren');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  const data = 'data';

  tab.sendToChildren(data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.PARENT_COMMUNICATION, data));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToChildren will call __sendToChildren with the correct event and defaults', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChildren');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  tab.sendToChildren();

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.PARENT_COMMUNICATION, null));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToChildren will call __sendToChildren with the correct event and defaults', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToChildren');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  tab.sendToChildren();

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.PARENT_COMMUNICATION, null));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToParent will call __sendToParent with the correct event', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToParent');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  const data = 'data';

  tab.sendToParent(data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.CHILD_COMMUNICATION, data));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToParent will call __sendToParent with the correct event with defaults', (t) => {
  const receivePingStub = sinon.stub(TabTalk.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(TabTalk.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(TabTalk.prototype, '__sendToParent');

  const config = {};

  const tab = new TabTalk(config, {});

  sendStub.reset();

  tab.sendToParent();

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.CHILD_COMMUNICATION, null));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});
