export const DEFAULT_CONFIG = {
  isInIframe: false,
  onChildClose() {},
  onChildCommunication() {},
  onChildRegister() {},
  onClose() {},
  onRegister() {},
  origin: window.origin,
};

export const EVENT = {
  REGISTER: 'REGISTER',
  SET_TAB_STATUS: 'SET_TAB_STATUS',
};

export const HAS_SESSION_STORAGE = !!(window && 'sessionStorage' in window);

export const SESSION_STORAGE_KEY = '__TABTALK_TAB_METADATA__';

export const TAB_REFERENCE_KEY = '__TABTALK_TAB__';

export const TAB_STATUS = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
};
