/**
 * @constant {string} ENCRYPTION_KEY
 */
export const ENCRYPTION_KEY = '__TABTALK_ENCRYPTION_KEY__';

/**
 * @constant {Object} EVENT the events passed via postmessage
 */
export const EVENT = {
  CHILD_COMMUNICATION: 'CHILD_COMMUNICATION',
  PARENT_COMMUNICATION: 'PARENT_COMMUNICATION',
  PING_CHILD: 'PING_CHILD',
  PING_PARENT: 'PING_PARENT',
  REGISTER: 'REGISTER',
  SET_TAB_STATUS: 'SET_TAB_STATUS',
};

/**
 * @constant {number} PING_INTERVAL the default interval between pings
 */
export const PING_INTERVAL = 5000;

/**
 * @constant {number} PING_CHECKIN_BUFFER the default buffer time to allow tabs not to ping in with
 */
export const PING_CHECKIN_BUFFER = 5000;

/**
 * @constant {number} REGISTRATION_BUFFER the default buffer time to wait for tabs to register
 */
export const REGISTRATION_BUFFER = 10000;

/**
 * @constant {string} SESSION_STORAGE_KEY the base of the key used for sessionStorage of a specific tab
 */
export const SESSION_STORAGE_KEY = '__TABTALK_TAB_METADATA__';

/**
 * @constant {string} TAB_REFERENCE_KEY the key on the window used for storing freshly-created tabs
 */
export const TAB_REFERENCE_KEY = '__TABTALK_TAB__';

/**
 * @constant {Object} TAB_STATUS the status of the tab
 */
export const TAB_STATUS = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
};

/**
 * @constant {Object} DEFAULT_CONFIG the default config values
 */
export const DEFAULT_CONFIG = {
  encryptionKey: ENCRYPTION_KEY,
  origin: window.origin || document.domain || '*',
  pingCheckinBuffer: PING_CHECKIN_BUFFER,
  pingInterval: PING_INTERVAL,
  registrationBuffer: REGISTRATION_BUFFER,
  removeOnClose: false,
};
