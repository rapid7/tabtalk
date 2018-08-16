// external dependencies
import {
  decrypt,
  encrypt
} from 'krip';
import {
  call,
  get,
  getOr
} from 'unchanged';
import uuid from 'uuid/v4';

// constants
import {
  DEFAULT_CONFIG,
  EVENT,
  SESSION_STORAGE_KEY,
  TAB_REFERENCE_KEY,
  TAB_STATUS
} from './constants';

// storage
import {
  getStorageData,
  removeStorageData,
  setStorageData
} from './sessionStorage';

// utils
import {
  assign,
  find,
  getChildWindowName
} from './utils';

const getId = get(['id']);
const getOrigin = get(['origin']);
const getPingInterval = get(['pingInterval']);

const EXISTING_TAB = getOr(null, [TAB_REFERENCE_KEY], window);

class Tab {
  constructor(config, {id, ref = window, windowName = window.name}) {
    this.__children = [];
    this.config = assign({}, DEFAULT_CONFIG, config);
    this.created = Date.now();
    this.lastCheckin = null;
    this.lastParentCheckin = null;
    this.parent = ref.opener || null;
    this.sendPingInterval = null;
    this.ref = ref;
    this.status = TAB_STATUS.OPEN;
    this.windowName = config.windowName || windowName || `${SESSION_STORAGE_KEY}:ROOT`;

    window.name = this.windowName;

    const currentStorageData = getStorageData(this.windowName);

    this.id = id || getId(EXISTING_TAB) || getId(currentStorageData) || uuid();

    removeStorageData(this.windowName);

    this.__clearPingIntervals();

    this.receivePingInterval = this.__setReceivePingInterval();

    if (ref === window) {
      this.__addEventListeners();
      this.__register();
      this.__setSendPingInterval();
    }
  }

  get children() {
    return this.__children.slice(0);
  }

  get closedChildren() {
    return this.__children.filter(({status}) => status === TAB_STATUS.CLOSED);
  }

  get openChildren() {
    return this.__children.filter(({status}) => status === TAB_STATUS.OPEN);
  }

  __addChild(child) {
    this.__children.push(child);
  }

  __addEventListeners() {
    call(
      ['addEventListener'],
      [
        'beforeunload',
        () => {
          setStorageData(this.windowName, {
            id: this.id,
          });

          this.__clearPingIntervals();
          this.__sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.CLOSED);

          this.config.onClose();
        },
      ],
      this.ref
    );

    call(['addEventListener'], ['message', this.__handleMessage], this.ref);

    call(['addEventListener'], ['beforeunload', () => call(['onParentClose'], [], this.config)], this.parent);
  }

  __clearPingIntervals() {
    clearInterval(this.receivePingInterval);
    clearInterval(this.sendPingInterval);
  }

  __handleOnChildCommunicationMessage({child, data}) {
    return child && call(['onChildCommunication'], [data, Date.now()], this.config);
  }

  __handleOnParentCommunicationMessage({childId, data}) {
    return childId === this.id && call(['onParentCommunication'], [data, Date.now()], this.config);
  }

  __handlePingChildMessage({childId, data: lastParentCheckin}) {
    return childId === this.id && (this.lastParentCheckin = lastParentCheckin);
  }

  __handlePingParentMessage({child: existingChild, id, lastCheckin, source}) {
    const child =
      existingChild
      || new Tab(this.config, {
        id,
        ref: source,
        windowName: getChildWindowName(id, this.id),
      });

    if (child !== existingChild) {
      this.__addChild(child);
    }

    return (child.lastCheckin = lastCheckin) && child;
  }

  __handleRegisterMessage(payload) {
    const child = this.__handlePingParentMessage(payload);

    call(['onChildRegister'], [child], this.config);
  }

  __handleSetStatusMessage({child, status}) {
    if (!child) {
      return;
    }

    child.status = status;

    if (status === TAB_STATUS.CLOSED) {
      call(['onChildClose'], [child], this.config);

      if (get(['removeOnClosed'], this.config)) {
        this.__removeChild(child);
      }
    }
  }

  __handleMessage = ({data: eventData, origin, source}) => {
    try {
      const {data, event, id} = JSON.parse(eventData);

      if (origin !== getOrigin(this.config) || !event || event !== EVENT[event]) {
        return null;
      }

      const child = find(({id: childId}) => childId === id, this.__children);

      decrypt(data, TAB_REFERENCE_KEY)
        .then((decrypted) => {
          switch (event) {
            case EVENT.PING_CHILD:
              return this.__handlePingChildMessage(decrypted);

            case EVENT.PING_PARENT:
              return this.__handlePingParentMessage({
                child,
                id,
                lastCheckin: decrypted,
                source,
              });

            case EVENT.REGISTER:
              return this.__handleRegisterMessage({
                child,
                id,
                lastCheckin: decrypted,
                source,
              });

            case EVENT.SET_TAB_STATUS:
              return this.__handleSetStatusMessage({
                child,
                status: decrypted,
              });

            case EVENT.CHILD_COMMUNICATION:
              return this.__handleOnChildCommunicationMessage({
                child,
                data: decrypted,
              });

            case EVENT.PARENT_COMMUNICATION:
              return this.__handleOnParentCommunicationMessage(decrypted);
          }
        })
        // eslint-disable-next-line no-console
        .catch((error) => console.error(error));
    } catch (error) {
      // ignored
    }
  };

  __register() {
    this.__sendToParent(EVENT.REGISTER, Date.now());
    this.__sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.OPEN);

    this.config.onRegister(this);
  }

  __removeChild(child) {
    this.__children.splice(this.children.indexOf(child), 1);
  }

  __sendToChild(id, event, data = null) {
    const child = find(({id: childId}) => childId === id, this.__children);
    const childId = getId(child);

    return (
      childId
      && encrypt(
        {
          childId,
          data,
        },
        TAB_REFERENCE_KEY
      ).then((encrypted) =>
        child.ref.postMessage(
          JSON.stringify({
            data: encrypted,
            event,
            id: this.id,
          }),
          getOrigin(this.config)
        )
      )
    );
  }

  __sendToChildren(event, data = null) {
    this.__children.forEach((child) => child.status === TAB_STATUS.OPEN && this.__sendToChild(child.id, event, data));
  }

  __sendToParent(event, data = null) {
    return (
      this.parent
      && encrypt(data, TAB_REFERENCE_KEY).then((encrypted) =>
        this.parent.postMessage(
          JSON.stringify({
            data: encrypted,
            event,
            id: this.id,
          }),
          this.config.origin
        )
      )
    );
  }

  __setReceivePingInterval() {
    this.receivePingInterval = setInterval(() => {
      this.__children.forEach((child) => {
        if (child.status === TAB_STATUS.CLOSED) {
          return;
        }

        const hasTimedOut = child.lastCheckin
          ? child.lastCheckin < this.config.pingInterval + this.config.pingCheckinBuffer
          : child.created + this.config.registrationBuffer < Date.now();

        return hasTimedOut && (child.status = TAB_STATUS.CLOSED);
      });
    }, getPingInterval(this.config));
  }

  __setSendPingInterval() {
    this.sendPingInterval = setInterval(() => {
      const lastCheckin = Date.now();

      this.lastCheckin = lastCheckin;

      if (this.parent) {
        this.__sendToParent(EVENT.PING_PARENT, lastCheckin);
      } else if (this.__children.length) {
        this.__children.forEach(({id}) => this.__sendToChild(id, EVENT.PING_CHILD, lastCheckin));
      }
    }, getPingInterval(this.config));
  }

  open({url, windowOptions}) {
    return new Promise((resolve) => resolve(window.open(url, '_blank', windowOptions))).then((childWindow) => {
      const child = new Tab(this.config, {
        ref: childWindow,
      });

      childWindow[TAB_REFERENCE_KEY] = child;
      childWindow.name = getChildWindowName(child.id, this.id);

      this.__addChild(child);

      return child;
    });
  }

  sendToChild(id, data = null) {
    this.__sendToChild(id, EVENT.PARENT_COMMUNICATION, data);
  }

  sendToChildren(data = null) {
    this.__sendToChildren(EVENT.PARENT_COMMUNICATION, data);
  }

  sendToParent(data = null) {
    this.__sendToParent(EVENT.CHILD_COMMUNICATION, data);
  }
}

export default Tab;
