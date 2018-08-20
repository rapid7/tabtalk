// test
import test from 'ava';
import {decrypt, encrypt} from 'krip';
import sinon from 'sinon';

// src
import Tab from 'src/Tab';
import {
  DEFAULT_CONFIG,
  EVENT,
  SESSION_STORAGE_KEY,
  TAB_REFERENCE_KEY,
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

test('if __addChild will add a new child to the internal children', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const tab = new Tab({}, {});

  const child = {id: 'foo'};

  tab.__addChild(child);

  t.deepEqual(tab.__children, [child]);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __addEventListeners will add the appropriate event listeners when there is a parent', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const addStub = sinon.stub(window, 'addEventListener');
  const setStorageStub = sinon.stub(storage, 'setStorageData');
  const clearStub = sinon.stub(Tab.prototype, '__clearPingIntervals');
  const parentStub = sinon.stub(Tab.prototype, '__sendToParent');

  const config = {
    onClose: sinon.spy(),
    onParentClose: sinon.spy(),
  };

  const currentOpener = window.opener;

  window.opener = {...window};

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const addStub = sinon.stub(window, 'addEventListener');
  const setStorageStub = sinon.stub(storage, 'setStorageData');
  const clearStub = sinon.stub(Tab.prototype, '__clearPingIntervals');
  const parentStub = sinon.stub(Tab.prototype, '__sendToParent');

  const config = {
    onClose: sinon.spy(),
    onParentClose: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const clearStub = sinon.stub(global, 'clearInterval');

  const config = {};

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onChildCommunication: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onChildCommunication: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onParentCommunication: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onParentCommunication: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

  const payload = {
    childId: 'blah',
    data: 12345,
  };

  tab.__handlePingChildMessage(payload);

  t.is(tab.lastParentCheckin, null);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.todo('__handlePingParentMessage');

test('if __handleRegisterMessage will call do the same as the ping parent message', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const child = {some: 'child'};

  const config = {
    onChildRegister: sinon.spy(),
  };

  const tab = new Tab(config, {});

  tab.__handlePingParentMessage = sinon.stub().returns(child);

  const payload = {some: 'payload'};

  tab.__handleRegisterMessage(payload);

  t.true(tab.__handlePingParentMessage.calledOnce);
  t.true(tab.__handlePingParentMessage.calledWith(payload));

  t.true(config.onChildRegister.calledOnce);
  t.true(config.onChildRegister.calledWith(child));

  receivePingStub.restore();
  sendPingStub.restore();
});

test.todo('__handleSetStatusMessage');

test.todo('__handleMessage');

test('if __register will call onRegister in the config', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {
    onRegister: sinon.spy(),
  };

  const tab = new Tab(config, {});

  config.onRegister.resetHistory();

  tab.__register();

  t.true(config.onRegister.calledOnce);
  t.true(config.onRegister.calledWith(tab));

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if __register will call __sendToParent if there is a parent', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(Tab.prototype, '__sendToParent');

  const config = {
    onRegister: sinon.spy(),
  };

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

  const child = {some: 'child'};

  tab.__children.push(child);

  t.deepEqual(tab.__children, [child]);

  tab.__removeChild(child);

  t.deepEqual(tab.__children, []);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will send the encrypted message to the child via postMessage', async (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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

  const decryptedData = await decrypt(parsedMessage.data, TAB_REFERENCE_KEY);

  t.deepEqual(decryptedData, {
    childId: id,
    data,
  });
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChild will reject if no child is found', async (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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
    t.is(error.message, 'Tab is closed.');
  }

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToChildren will iterate over the open children and call __sendToChild', async (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(Tab.prototype, '__sendToChild').resolves();

  const config = {};

  const tab = new Tab(config, {});

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

test.serial('if __sendToParent will send the encrypted message to the parent via postMessage', async (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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

  const decryptedData = await decrypt(parsedMessage.data, TAB_REFERENCE_KEY);

  t.deepEqual(decryptedData, data);
  t.is(origin, tab.config.origin);

  receivePingStub.restore();
  sendPingStub.restore();
});

test.serial('if __sendToParent will reject if there is no parent', async (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);

  const config = {};

  const tab = new Tab(config, {});

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

test.todo('__setReceivePingInterval');

test.todo('__setSendPingInterval');

test.todo('close');

test.todo('open');

test('if sendToChild will call __sendToChild with the correct event', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(Tab.prototype, '__sendToChild');

  const config = {};

  const tab = new Tab(config, {});

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

test('if sendToChildren will call __sendToChildren with the correct event', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(Tab.prototype, '__sendToChildren');

  const config = {};

  const tab = new Tab(config, {});

  sendStub.reset();

  const data = 'data';

  tab.sendToChildren(data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.PARENT_COMMUNICATION, data));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});

test('if sendToParent will call __sendToParent with the correct event', (t) => {
  const receivePingStub = sinon.stub(Tab.prototype, '__setReceivePingInterval').returns(123);
  const sendPingStub = sinon.stub(Tab.prototype, '__setSendPingInterval').returns(234);
  const sendStub = sinon.stub(Tab.prototype, '__sendToParent');

  const config = {};

  const tab = new Tab(config, {});

  sendStub.reset();

  const data = 'data';

  tab.sendToParent(data);

  t.true(sendStub.calledOnce);
  t.true(sendStub.calledWith(EVENT.CHILD_COMMUNICATION, data));

  sendStub.restore();

  receivePingStub.restore();
  sendPingStub.restore();
});
