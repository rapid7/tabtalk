export const EVENT = {
  CHILD_COMMUNICATION: 'CHILD_COMMUNICATION',
  PARENT_COMMUNICATION: 'PARENT_COMMUNICATION',
  PING_CHILD: 'PING_CHILD',
  PING_PARENT: 'PING_PARENT',
  REGISTER: 'REGISTER',
  SET_TAB_STATUS: 'SET_TAB_STATUS',
};

export const HAS_SESSION_STORAGE = !!(window && 'sessionStorage' in window);

export const PING_INTERVAL = 5000;

export const PING_CHECKIN_BUFFER = 5000;

export const REGISTRATION_BUFFER = 10000;

export const SESSION_STORAGE_KEY = '__TABTALK_TAB_METADATA__';

export const TAB_REFERENCE_KEY = '__TABTALK_TAB__';

export const TAB_STATUS = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
};

export const DEFAULT_CONFIG = {
  isInIframe: false,
  origin: window.origin,
  pingCheckinBuffer: PING_CHECKIN_BUFFER,
  pingInterval: PING_INTERVAL,
  registrationBuffer: REGISTRATION_BUFFER,
  removeOnClose: false,
};
