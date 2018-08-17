import browserEnv from 'browser-env';
import MockWebStorage from 'mock-webstorage';

browserEnv();

global.sessionStorage = window.sessionStorage = new MockWebStorage();
