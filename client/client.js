const net = require('net');
const readline = require('readline');

const client = new net.Socket();

process.stdout.setEncoding('utf8');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function init() {
  rl.question('Please provide a username: ', answer => {
    client.write(answer);
    rl.setPrompt(`${answer}: `);
    rl.prompt();
    rl.close();
  });
}

function operations() {
  client.on('data', data => {
    process.stdout.write(data);
  });

  client.on('close', () => {
    process.stdout.write('Connection closed \n');
  });

  client.on('error', err => {
    process.stdout.write(`err: ${err} \n`);
    process.stdout.write('Server is offline');
  });
}

function main() {
  client.connect(
    3000,
    '127.0.0.1',
    () => {
      process.stdout.write('Connection established \n');
      init();
    },
  );

  operations();
}

main();
