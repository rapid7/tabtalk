// src
import createTab from '../src';

const tab = createTab({
  onChildClose(child) {
    console.log('child closed', child);
  },
  onChildCommunication(message) {
    console.log('child communication', message);
  },
  onChildRegister(child) {
    console.log('child registered', child);
  },
  onParentClose() {
    console.log('parent closed');
  },
  onParentCommunication(message) {
    console.log('parent communication', message);
  },
  onRegister(tab) {
    console.log('registered', tab);
  },
});

console.log(tab);

let createdChild;

const sendDelayedCommunication = async (child) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (tab.parent) {
    console.log('sending to parent');

    tab.sendToParent({
      id: tab.id,
      message: 'I am your child!',
    });
  }

  if (child) {
    console.log('sending to child', child.id);

    tab.sendToChild(child.id, {
      id: tab.id,
      message: 'I am your parent!',
    });
  }
};

const createChild = async () => {
  createdChild = await tab.open({url: 'http://localhost:3000'});

  console.log(tab);
  console.log(tab.children);

  sendDelayedCommunication(createdChild);
};

const button = document.createElement('button');

button.textContent = 'Click to open child';
button.onclick = createChild;

document.body.appendChild(button);

sendDelayedCommunication(tab.children[0]);
