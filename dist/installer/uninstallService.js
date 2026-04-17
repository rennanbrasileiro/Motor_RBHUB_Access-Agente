"use strict";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('node-windows').Service;
const path = require('path');
const script = path.resolve(process.cwd(), 'dist', 'main.js');
const svc = new Service({
    name: 'RBHub Access Agent',
    script
});
svc.on('uninstall', () => {
    console.log('RBHub Access Agent removido.');
});
svc.uninstall();
