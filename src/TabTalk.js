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
  findChildTab,
  filter,
  map,
  getChildWindowName,
  getHasTimedOut
} from './utils';

const getEncryptionKey = get(['encryptionKey']);
const getId = get(['id']);
const getOrigin = get(['origin']);
const getPingInterval = get(['pingInterval']);
const getRemoveOnClosed = get(['removeOnClosed']);

/**
 * @constant {Object|null} EXISTING_TAB the tab already existing on the window
 */
const EXISTING_TAB = getOr(null, [TAB_REFERENCE_KEY], window);

/**
 * @class TabTalk
 *
 * @classdesc
 * manager that allows for communication both with opened children and with parents that opened it
 */
class TabTalk {
  /**
   * @function constructor
   *
   * @description
   * build a new tab instance, assigning internal values and kicking off listeners when appropriate
   *
   * @param {Object} config the configuration object
   * @param {Window} [ref=window] the reference to the tab's own window
   * @param {string} [windowName=window.name] the name for the given window
   * @returns {TabTalk} the tab instance
   */
  constructor(config, {id, ref = window, windowName = window.name}) {
    this.__children = [];
    this.config = assign({}, DEFAULT_CONFIG, config);
    this.created = Date.now();
    this.lastCheckin = null;
    this.lastParentCheckin = null;
    this.parent = ref.opener || null;
    this.receivePingInterval = null;
    this.sendPingInterval = null;
    this.ref = ref;
    this.status = TAB_STATUS.OPEN;
    this.windowName = config.windowName || windowName || `${SESSION_STORAGE_KEY}:ROOT`;

    window.name = this.windowName;

    const currentStorageData = getStorageData(this.windowName);

    this.id = id || getId(EXISTING_TAB) || getId(currentStorageData) || uuid();

    removeStorageData(this.windowName);

    this.__clearPingIntervals();
    this.__setSendPingInterval();

    if (ref === window) {
      this.__addEventListeners();
      this.__register();
      this.__setReceivePingInterval();
    }
  }

  /**
   * @type {Array<TabTalk>}
   */
  get children() {
    return this.__children.slice(0);
  }

  /**
   * @type {Array<TabTalk>}
   */
  get closedChildren() {
    return filter(({status}) => status === TAB_STATUS.CLOSED, this.__children);
  }

  /**
   * @type {Array<TabTalk>}
   */
  get openChildren() {
    return filter(({status}) => status === TAB_STATUS.OPEN, this.__children);
  }

  /**
   * @function __addChild
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * add the child to the list of stored children
   *
   * @param {TabTalk} child the child tab
   */
  __addChild(child) {
    this.__children.push(child);
  }

  /**
   * @function __addEventListeners
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * add the event listeners for both messaging and unload / closure of tabs
   */
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

          if (this.parent) {
            this.__sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.CLOSED);
          }

          call(['onClose'], [], this.config);
        },
      ],
      this.ref
    );

    call(['addEventListener'], ['message', this.__handleMessage], this.ref);

    call(['addEventListener'], ['beforeunload', () => call(['onParentClose'], [], this.config)], this.parent);
  }

  /**
   * @function __clearPingIntervals
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * clear the ping intervals
   */
  __clearPingIntervals() {
    clearInterval(this.receivePingInterval);
    clearInterval(this.sendPingInterval);
  }

  /**
   * @function __handleOnChildCommunicationMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle messages from child tabs
   *
   * @param {TabTalk} [child] the child tab sending the message
   * @param {any} data the data send in the message
   * @returns {any} the message data
   */
  __handleOnChildCommunicationMessage({child, data}) {
    return child && call(['onChildCommunication'], [data, Date.now()], this.config);
  }

  /**
   * @function __handleOnParentCommunicationMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle messages from the parent tab
   *
   * @param {string} childId the id of the child sending the message
   * @param {any} data the data send in the message
   * @returns {any} the message data
   */
  __handleOnParentCommunicationMessage({childId, data}) {
    return childId === this.id && call(['onParentCommunication'], [data, Date.now()], this.config);
  }

  /**
   * @function __handlePingChildMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle pings from the parent tab
   *
   * @param {string} childId the id of the child sending the message
   * @param {number} lastParentCheckin the epoch of the last checkin time
   * @returns {void}
   */
  __handlePingChildMessage({childId, data: lastParentCheckin}) {
    return childId === this.id && (this.lastParentCheckin = lastParentCheckin);
  }

  /**
   * @function __handlePingParentOrRegisterMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle pings or registration from a child tab, auto-registering if a ping comes
   * from a child that does not currently exist
   *
   * @param {TabTalk} [existingChild] the child sending the ping
   * @param {string} id the id of the child tab
   * @param {number} lastParentCheckin the epoch of the last checkin time
   * @param {Window} source the window of the child tab
   * @returns {TabTalk} the child tab
   */
  __handlePingParentOrRegisterMessage({child: existingChild, id, lastCheckin, source}) {
    const child =
      existingChild
      || new TabTalk(this.config, {
        id,
        ref: source,
        windowName: getChildWindowName(id, this.id),
      });

    if (!child.lastCheckin) {
      this.__addChild(child);

      call(['onChildRegister'], [child], this.config);
    }

    return (child.lastCheckin = lastCheckin) && child;
  }

  /**
   * @function __handleSetStatusMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle the setting of tab status
   *
   * @param {TabTalk} child the child tab
   * @param {string} status the new status of the tab
   */
  __handleSetStatusMessage({child, status}) {
    if (!child) {
      return;
    }

    child.status = status;

    if (status === TAB_STATUS.CLOSED) {
      call(['onChildClose'], [child], this.config);

      if (getRemoveOnClosed(this.config)) {
        this.__removeChild(child);
      }
    }
  }

  /**
   * @function __handleMessage
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * handle the message from postMessage
   *
   * @param {string} data the raw data from the message
   * @param {string} origin the origin of the message (must match that of the tab configuration)
   * @param {Window} source the window of the source tab
   * @returns {any}
   */
  __handleMessage = ({data: eventData, origin, source}) => {
    try {
      const {data, event, id} = JSON.parse(eventData);

      if (origin !== getOrigin(this.config) || !event || event !== EVENT[event]) {
        return;
      }

      const child = findChildTab(this.__children, id);

      return (
        decrypt(data, getEncryptionKey(this.config))
          .then((decrypted) => {
            switch (event) {
              case EVENT.PING_CHILD:
                return this.__handlePingChildMessage(decrypted);

              case EVENT.PING_PARENT:
              case EVENT.REGISTER:
                return this.__handlePingParentOrRegisterMessage({
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
          .catch((error) => console.error(error))
      );
    } catch (error) {
      // ignored
    }
  };

  /**
   * @function __register
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * register the tab to the parent
   */
  __register() {
    if (this.parent) {
      this.__sendToParent(EVENT.REGISTER, Date.now());
      this.__sendToParent(EVENT.SET_TAB_STATUS, TAB_STATUS.OPEN);
    }

    call(['onRegister'], [this], this.config);
  }

  /**
   * @function __removeChild
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * remove the child from the stored children
   *
   * @param {TabTalk} child the child tab
   */
  __removeChild(child) {
    this.__children.splice(this.children.indexOf(child), 1);
  }

  /**
   * @function _sendToChild
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * send data to a specific child
   *
   * @param {string} id the id of the child tab
   * @param {string} event the tabtalk event
   * @param {any} [data=null] the data to send
   * @returns {Promise}
   */
  __sendToChild(id, event, data = null) {
    const child = findChildTab(this.__children, id);
    const childId = getId(child);

    return childId
      ? child.status === TAB_STATUS.OPEN
        ? encrypt(
          {
            childId,
            data,
          },
          getEncryptionKey(this.config)
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
        : Promise.reject(new Error('TabTalk is closed.'))
      : Promise.reject(new Error('Child could not be found.'));
  }

  /**
   * @function __sendToChildren
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * send data to all children
   *
   * @param {string} event the tabtalk event
   * @param {any} [data=null] the data to send
   * @returns {Promise}
   */
  __sendToChildren(event, data = null) {
    return Promise.all(map(({id}) => this.__sendToChild(id, event, data), this.openChildren));
  }

  /**
   * @function __sendToParent
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * send data to the parent
   *
   * @param {string} event the tabtalk event
   * @param {any} [data=null] the data to send
   * @returns {Promise}
   */
  __sendToParent(event, data = null) {
    return this.parent
      ? encrypt(data, getEncryptionKey(this.config)).then((encrypted) =>
        this.parent.postMessage(
          JSON.stringify({
            data: encrypted,
            event,
            id: this.id,
          }),
          getOrigin(this.config)
        )
      )
      : Promise.reject(new Error('Parent could not be found.'));
  }

  /**
   * @function __setReceivePingInterval
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * set the interval to check for pings received from child tabs
   */
  __setReceivePingInterval() {
    clearInterval(this.receivePingInterval);

    this.receivePingInterval = setInterval(
      () =>
        map(
          (child) =>
            getHasTimedOut(child, this.config)
            && this.__handleSetStatusMessage({
              child,
              status: TAB_STATUS.CLOSED,
            }),
          this.openChildren
        ),
      getPingInterval(this.config)
    );
  }

  /**
   * @function __setSendPingInterval
   * @memberof TabTalk
   *
   * @private
   *
   * @description
   * set the interval to send pings to children and / or parent
   */
  __setSendPingInterval() {
    clearInterval(this.sendPingInterval);

    this.sendPingInterval = setInterval(() => {
      const lastCheckin = Date.now();

      this.lastCheckin = lastCheckin;

      if (this.parent) {
        this.__sendToParent(EVENT.PING_PARENT, lastCheckin);
      }

      if (this.__children.length) {
        this.__sendToChildren(EVENT.PING_CHILD, lastCheckin);
      }
    }, getPingInterval(this.config));
  }

  /**
   * @function close
   * @memberof TabTalk
   *
   * @description
   * close the child tab with the given id
   *
   * @param {string} id the id of the tab to close
   */
  close(id) {
    if (!id) {
      return call(['close'], [], this.ref);
    }

    const child = findChildTab(this.__children, id);

    if (!child || child.status !== TAB_STATUS.OPEN) {
      return;
    }

    child.status = TAB_STATUS.CLOSED;

    call(['close'], [], child.ref);

    if (getRemoveOnClosed(this.config)) {
      this.__removeChild(child);
    }
  }

  /**
   * @function open
   * @memberof TabTalk
   *
   * @description
   * open the tab with the given options
   *
   * @param {string} url the url to open
   * @param {string} windowFeatures the options to open the window with
   * @returns {Promise} promise that resolves to the opened tab
   */
  open({config = this.config, url, windowFeatures}) {
    return new Promise((resolve) => resolve(window.open(url, '_blank', windowFeatures))).then((childWindow) => {
      const child = new TabTalk(config, {
        ref: childWindow,
      });

      childWindow[TAB_REFERENCE_KEY] = child;
      childWindow.name = getChildWindowName(child.id, this.id);

      this.__addChild(child);

      return child;
    });
  }

  /**
   * @function sendToChild
   * @memberof TabTalk
   *
   * @description
   * send data to a specific child
   *
   * @param {string} id the id of the child tab
   * @param {any} [data=null] the data to send
   * @returns {Promise} promise that resolves once the data has been sent
   */
  sendToChild(id, data = null) {
    return this.__sendToChild(id, EVENT.PARENT_COMMUNICATION, data);
  }

  /**
   * @function sendToChildren
   * @memberof TabTalk
   *
   * @description
   * send data to all children
   *
   * @param {any} [data=null] the data to send
   * @returns {Promise} promise that resolves once the data has been sent to all children
   */
  sendToChildren(data = null) {
    return this.__sendToChildren(EVENT.PARENT_COMMUNICATION, data);
  }

  /**
   * @function sendToParent
   * @memberof TabTalk
   *
   * @description
   * send data to the parent
   *
   * @param {any} [data=null] the data to send
   * @returns {Promise} promise that resolves once the data has been sent
   */
  sendToParent(data = null) {
    return this.__sendToParent(EVENT.CHILD_COMMUNICATION, data);
  }
}

export default TabTalk;
