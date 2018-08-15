// external dependencies
import {
  decrypt,
  encrypt
} from 'krip';
import {
  get,
  getOr
} from 'unchanged';
import uuid from 'uuid/v4';

// constants
import {
  DEFAULT_CONFIG,
  EVENT,
  TAB_REFERENCE_KEY,
  TAB_STATUS
} from './constants';

// storage
import {
  getStorageData,
  setStorageData
} from './sessionStorage';

// utils
import {assign} from './utils';

const getId = get(['id']);

const EXISTING_TAB = getOr(null, [TAB_REFERENCE_KEY], window);

class Tab {
  constructor(config = {}, ref = window) {
    this.__children = [];
    this.config = assign({}, DEFAULT_CONFIG, config);
    this.parent = ref.opener || null;
    this.ref = ref;
    this.status = TAB_STATUS.OPEN;

    const currentStorageData = getStorageData();

    this.id = getId(EXISTING_TAB) || getId(currentStorageData) || uuid();

    setStorageData(null);

    if (ref === window) {
      this.addEventListeners();
      this.register();
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

  addEventListeners() {
    this.ref.addEventListener('beforeunload', () => {
      setStorageData({
        id: this.id,
      });

      this.sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.CLOSED);

      this.config.onClose();
    });

    this.ref.addEventListener('message', this.handleMessage);
  }

  handleMessage = ({data: eventData, origin}) => {
    try {
      const {data, event, id} = JSON.parse(eventData);

      if (origin !== this.config.origin || !event || event !== EVENT[event]) {
        return null;
      }

      decrypt(data, TAB_REFERENCE_KEY)
        .then((decrypted) => {
          const childTab = this.__children.find(({id: childId}) => id === childId);

          if (!childTab) {
            return null;
          }

          switch (event) {
            case EVENT.REGISTER:
              return this.config.onChildRegister(childTab);

            case EVENT.SET_TAB_STATUS:
              childTab.status = decrypted;

              return decrypted === TAB_STATUS.CLOSED ? this.config.onChildClose(childTab) : null;
          }
        })
        .catch((error) => console.error(error));
    } catch (error) {
      // ignored
    }
  };

  open({url, windowOptions}) {
    return new Promise((resolve) => resolve(window.open(url, '_blank', windowOptions))).then((childWindow) => {
      const childTab = new Tab(this.config, childWindow);

      childWindow[TAB_REFERENCE_KEY] = childTab;

      this.__children.push(childTab);

      return childTab;
    });
  }

  register() {
    this.sendToParent(EVENT.REGISTER);
    this.sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.OPEN);

    this.config.onRegister(this);
  }

  sendToParent(event, data = null) {
    if (this.parent) {
      encrypt(data, TAB_REFERENCE_KEY).then((encrypted) =>
        this.parent.postMessage(
          JSON.stringify({
            data: encrypted,
            event,
            id: this.id,
          }),
          this.config.origin
        )
      );
    }
  }
}

export const createTab = (config) => new Tab(config);
