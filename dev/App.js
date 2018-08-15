// src
import createTab from '../src';

const tab = createTab({
  onChildClose(child) {
    console.log('child closed', child);
  },
  onChildRegister(child) {
    console.log('child registered', child);
  },
  onRegister(tab) {
    console.log('registered', tab);
  },
});

console.log(tab);

const createChild = async () => {
  const child = await tab.open({url: 'http://localhost:3000'});

  console.log(tab);
  console.log(tab.children);
};

const button = document.createElement('button');

button.textContent = 'Click to open child';
button.onclick = createChild;

document.body.appendChild(button);
