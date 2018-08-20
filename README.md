# tabtalk

Simple, secure cross-origin communication between browser tabs

## Table of contents

- [Usage](#usage)
- [createTab](#createtab)
  - [config](#config)
- [TabTalk instance API](#tabtalk-instance-api)
  - [open](#open)
  - [close](#close)
  - [sendToChild](#sendtochild)
  - [sendToChildren](#sendtochildren)
  - [sendToParent](#sendtoparent)

## Usage

```javascript
import createTab from 'tabtalk';

const tabtalk = createTab({
  onChildCommunication(message) {
    console.log('message from child', message);
  },
  onChildRegister(childTab) {
    tabtalk.sendToChild(childTab.id, 'Hello my child!');
  },
  onRegister() {
    console.log('ready to go!');
  },
});

tabtalk.open({url: 'http://www.example.com'});
```

Messages are sent by `postMessage`, allowing for cross-origin usage (with the use of custom `config` properties), and the data in the message is encrypted with `krip` under the hood.

## createTab

```javascript
createTab([config: Object]): TabTalk
```

Creates a new `TabTalk` instance where the window it is executed in (itself) is the tab. The instance returned allows you to open children, and will automatically glean its parent if it was opened from another `TabTalk` instance.

#### config

`createTab` optionally accepts a `config` object which has the following shape:

```javascript
{
  // custom key to be used by krip for encryption / decription
  // HIGHLY RECOMMENDED
  encryptionKey: string,

  // called when child closes
  onChildClose: (child: TabTalk) => void,

  // called when child sends message to self
  onChildCommunication: (message: any, eventTime: number) => void,

  // called when child registers with parent
  onChildRegister: (child: TabTalk) => void,

  // called when self is closed
  onClose: () => void,

  // called when parent is closed
  onParentClose: () => void,

  // called when parent sends message to self
  onParentCommunication: (message: any, eventTime: number) => void,

  // called when self registers
  onRegister: (self: TabTalk) => void,

  // the origin to use for cross-tab validation
  origin: string = window.origin || document.domain || '*',

  // the delay to wait when a tab doesn't check in but has already checked in
  pingCheckinBuffer: number = 5000,

  // the delay to wait before the next check if tab is checking in
  pingInterval: number = 5000,

  // the delay to wait when a tab doesn't check in and has never checked in
  registrationBuffer: number = 10000,

  // should the tab be removed as a child when closed
  removeOnClose: boolean = false,
}
```

## TabTalk instance API

#### open

Opens a new child `TabTalk` instance and stores it as a child in the opener's `TabTalk` instance. Resolves the child instance.

```javascript
open(options: Object): Promise<TabTalk>
```

Example:

```javascript
const openChild = async config => {
  const child = await tabtalk.open({
    config,
    url: 'http://www.example.com/',
  });

  return child;
};
```

`open()` accepts the following options:

```javascript
{
  // the config to pass through to createTab for the child
  config: Object = self.config,

  // the destination to open
  url: string,

  // any windowFeatures to apply to the opened window
  windowFeatures: string,
}
```

For more information on `windowFeatures`, [see the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/open#Parameters).

#### close

Closes the `TabTalk` instance, or if an ID is passed then closes that matching child `TabTalk` instance.

```javascript
close([id: string]) => void
```

Example:

```javascript
tabtalk.close(); // closes self

tabtalk.close(child.id); // closes specific child
```

#### sendToChild

Send data to a specific child. The promise resolved is empty, it's mainly to have control flow over a successful message sent.

```javascript
sendToChild(id: string, data: any): Promise<null>
```

Example:

```javascript
tabtalk.sendToChild(child.id, {
  message: 'Special message',
  total: 1234.56,
});
```

**NOTE**: Data can be anything that is serializable by `JSON.stringify`.

#### sendToChildren

Send data to all children. The promise resolved is empty, it's mainly to have control flow over a successful message sent.

```javascript
sendToChildren(data: any): Promise<null>
```

Example:

```javascript
tabtalk.sendToChildren({
  message: 'Special message',
  total: 1234.56,
});
```

**NOTE**: Data can be anything that is serializable by `JSON.stringify`.

#### sendToParent

Send data to the parent. The promise resolved is empty, it's mainly to have control flow over a successful message sent.

```javascript
sendToParent(data: any): Promise<null>
```

Example:

```javascript
tabtalk.sendToParent({
  message: 'Special message',
  total: 1234.56,
});
```

**NOTE**: Data can be anything that is serializable by `JSON.stringify`.

## Support

Support is mainly driven by `krip` support, as `postMessage` works correctly back to IE8.

- Chrome 37+
- Firefox 34+
- Edge (all versions)
- Opera 24+
- IE 11+
  - Requires polyfills for `Promise`, `TextDecoder`, and `TextEncoder`
- Safari 7.1+
- iOS 8+
- Android 5+

## Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

- `build` => run `rollup` to build browser and node versions
  - standard versions to top-level directory, minified versions to `dist` folder
- `clean:dist` => run `rimraf` on `dist` folder
- `dev` => run `webpack` dev server to run example app / playground
- `dist` => run `clean:dist`, `build`
- `lint` => run `eslint` against all files in the `src` folder
- `lint:fix` => run `lint`, fixing issues when possible
- `prepublish` => runs `prepublish:compile` when publishing
- `prepublish:compile` => run `lint`, `test:coverage`, `build`
- `start` => run `dev`
- `test` => run AVA test functions with `NODE_ENV=test`
- `test:coverage` => run `test` but with `nyc` for coverage checker
- `test:watch` => run `test`, but with persistent watcher
