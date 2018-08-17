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
  getChildWindowName
} from './utils';

const getId = get(['id']);
const getOrigin = get(['origin']);
const getPingInterval = get(['pingInterval']);
const getRemoveOnClosed = get(['removeOnClosed']);

/**
 * @constant {Object|null} EXISTING_TAB the tab already existing on the window
 */
const EXISTING_TAB = getOr(null, [TAB_REFERENCE_KEY], window);

/**
 * @class Tab
 *
 * @classdesc
 * manager that allows for communication both with opened children and with parents that opened it
 */
class Tab {
  /**
   * @function constructor
   *
   * @description
   * build a new tab instance, assigning internal values and kicking off listeners when appropriate
   *
   * @param {Object} config the configuration object
   * @param {Window} [ref=window] the reference to the tab's own window
   * @param {string} [windowName=window.name] the name for the given window
   * @returns {Tab} the tab instance
   */
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

  /**
   * @type {Array<Tab>}
   */
  get children() {
    return this.__children.slice(0);
  }

  /**
   * @type {Array<Tab>}
   */
  get closedChildren() {
    return filter(({status}) => status === TAB_STATUS.CLOSED, this.__children);
  }

  /**
   * @type {Array<Tab>}
   */
  get openChildren() {
    return filter(({status}) => status === TAB_STATUS.OPEN, this.__children);
  }

  /**
   * @function __addChild
   * @memberof Tab
   *
   * @private
   *
   * @description
   * add the child to the list of stored children
   *
   * @param {Tab} child the child tab
   */
  __addChild(child) {
    this.__children.push(child);
  }

  /**
   * @function __addEventListeners
   * @memberof Tab
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

          this.config.onClose();
        },
      ],
      this.ref
    );

    call(['addEventListener'], ['message', this.__handleMessage], this.ref);

    call(['addEventListener'], ['beforeunload', () => call(['onParentClose'], [], this.config)], this.parent);
  }

  /**
   * @function __clearPingIntervals
   * @memberof Tab
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
   * @memberof Tab
   *
   * @private
   *
   * @description
   * handle messages from child tabs
   *
   * @param {Tab} [child] the child tab sending the message
   * @param {any} data the data send in the message
   * @returns {any} the message data
   */
  __handleOnChildCommunicationMessage({child, data}) {
    return child && call(['onChildCommunication'], [data, Date.now()], this.config);
  }

  /**
   * @function __handleOnParentCommunicationMessage
   * @memberof Tab
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
   * @memberof Tab
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
   * @function __handlePingParentMessage
   * @memberof Tab
   *
   * @private
   *
   * @description
   * handle pings from a child tab
   *
   * @param {Tab} [existingChild] the child sending the ping
   * @param {string} id the id of the child tab
   * @param {number} lastParentCheckin the epoch of the last checkin time
   * @param {Window} source the window of the child tab
   * @returns {Tab} the child tab
   */
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

  /**
   * @function __handleRegisterMessage
   * @memberof Tab
   *
   * @private
   *
   * @description
   * handle the registration of the child tab
   *
   * @param {Object} payload the payload of the message
   * @param {Tab} payload.child the child tab
   * @param {string} payload.id the id of the origin tab
   * @param {number} payload.lastCheckin the last checkin of the child tab
   * @param {Window} payload.source the window of the child tab
   */
  __handleRegisterMessage(payload) {
    const child = this.__handlePingParentMessage(payload);

    call(['onChildRegister'], [child], this.config);
  }

  /**
   * @function __handleSetStatusMessage
   * @memberof Tab
   *
   * @private
   *
   * @description
   * handle the setting of tab status
   *
   * @param {Tab} child the child tab
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
   * @memberof Tab
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
        return null;
      }

      const child = findChildTab(this.__children, id);

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

  /**
   * @function __register
   * @memberof Tab
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
   * @memberof Tab
   *
   * @private
   *
   * @description
   * remove the child from the stored children
   *
   * @param {Tab} child the child tab
   */
  __removeChild(child) {
    this.__children.splice(this.children.indexOf(child), 1);
  }

  /**
   * @function _sendToChild
   * @memberof Tab
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
        : Promise.reject('Tab is closed.')
      : Promise.reject('Child could not be found.');
  }

  /**
   * @function __sendToChildren
   * @memberof Tab
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
   * @memberof Tab
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
      ? encrypt(data, TAB_REFERENCE_KEY).then((encrypted) =>
        this.parent.postMessage(
          JSON.stringify({
            data: encrypted,
            event,
            id: this.id,
          }),
          this.config.origin
        )
      )
      : Promise.reject('Parent could not be found.');
  }

  /**
   * @function __setReceivePingInterval
   * @memberof Tab
   *
   * @private
   *
   * @description
   * set the interval to check for pings received from child tabs
   */
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

  /**
   * @function __setSendPingInterval
   * @memberof Tab
   *
   * @private
   *
   * @description
   * set the interval to send pings to children and / or parent
   */
  __setSendPingInterval() {
    this.sendPingInterval = setInterval(() => {
      const lastCheckin = Date.now();

      this.lastCheckin = lastCheckin;

      if (this.parent) {
        this.__sendToParent(EVENT.PING_PARENT, lastCheckin);
      } else if (this.__children.length) {
        this.__sendToChildren(EVENT.PING_CHILD, lastCheckin);
      }
    }, getPingInterval(this.config));
  }

  /**
   * @function close
   * @memberof Tab
   *
   * @private
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

    if (!child) {
      return;
    }

    call(['close'], [], child.ref);

    this.__removeChild(child);
  }

  /**
   * @function open
   * @memberof Tab
   *
   * @private
   *
   * @description
   * open the tab with the given options
   *
   * @param {string} url the url to open
   * @param {string} windowOptions the options to open the window with
   * @returns {Promise} promise that resolves to the opened tab
   */
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

  /**
   * @function sendToChild
   * @memberof Tab
   *
   * @private
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
   * @memberof Tab
   *
   * @private
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
   * @memberof Tab
   *
   * @private
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

export default Tab;
