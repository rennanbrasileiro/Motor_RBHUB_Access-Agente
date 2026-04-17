// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('node-windows').Service;
const path = require('path');

const script = path.resolve(process.cwd(), 'dist', 'main.js');
const svc = new Service({
  name: 'RBHub Access Agent',
  description: 'Serviço local do RBHub Access Agent',
  script,
  workingDirectory: process.cwd(),
  wait: 2,
  grow: 0.5,
  maxRetries: 5
});

svc.on('install', () => {
  svc.start();
  console.log('RBHub Access Agent instalado e iniciado com sucesso.');
});

svc.install();
