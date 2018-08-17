import browserEnv from 'browser-env';
import MockWebStorage from 'mock-webstorage';
import webcrypto from '@trust/webcrypto';
import {
  TextDecoder,
  TextEncoder
} from 'util';

browserEnv();

global.sessionStorage = window.sessionStorage = new MockWebStorage();

window.crypto = webcrypto;
window.Promise = global.Promise;

global.TextDecoder = window.TextDecoder = TextDecoder;
global.TextEncoder = window.TextEncoder = TextEncoder;
