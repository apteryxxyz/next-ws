import readline from 'node:readline';
import chalk from 'chalk';

// Helper functions

const prefix = (message: string, colour = chalk.cyan) =>
  `${colour('[next-ws]')} ${message}`;
const line = (message: string) => {
  // @ts-ignore
  if (message instanceof Error) return message;
  return String(message).replaceAll(/(?:\n\s*)+/g, ' ');
};

// Logging message builders

const log = (message: string) => prefix(line(message));
const info = (message: string) => prefix(line(message), chalk.cyan);
const warn = (message: string) => prefix(line(message), chalk.yellow);
const error = (message: string) => prefix(line(message), chalk.red);

// Task message builders

const loading = (symbol: string, message: string) =>
  prefix(`${chalk.cyan(symbol)} ${line(message)}`, chalk.cyan);
const success = (message: string) =>
  prefix(`${chalk.green('✔')} ${line(message)}`, chalk.green);
const failure = (message: string) =>
  prefix(`${chalk.red('✖')} ${line(message)}`, chalk.red);

// Make logging functions

const make =
  (
    type: 'log' | 'info' | 'warn' | 'error',
    modifier: (message: string) => string,
  ) =>
  (message: string) =>
    console[type](modifier(message));

// Inquirer confirm

async function confirm(message = 'Continue?', defaultChoice = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<boolean>((resolve) => {
    const question = `${prefix(line(message), chalk.yellow)}`;
    const options = `[${defaultChoice ? 'Y/n' : 'y/N'}]`;

    rl.question(`${question} ${chalk.cyan(options)} `, (answer) => {
      const normalisedAnswer = answer.trim().toLowerCase();
      if (normalisedAnswer === '') resolve(defaultChoice);
      else if (normalisedAnswer === 'y') resolve(true);
      else resolve(false);
      rl.close();
    });
  });
}

// Task runner with spinner

async function task<T>(title: string, promise: Promise<T>) {
  // Hide the cursor
  process.stdout.write('\x1B[?25l');

  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'];
  let spinnerIndex = 0;
  const spinnerInterval = setInterval(() => {
    readline.cursorTo(process.stdout, 0);
    const spinnerChar = spinnerChars[spinnerIndex++ % spinnerChars.length]!;
    process.stdout.write(loading(spinnerChar, title));
  }, 100);

  return promise
    .then((value) => {
      clearInterval(spinnerInterval);
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      console.info(success(title));
      return value;
    })
    .catch((err) => {
      clearInterval(spinnerInterval);
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      console.error(failure(title));
      throw err;
    })
    .finally(() => {
      // Show the cursor
      process.stdout.write('\x1B[?25h');
    });
}

// Logger

export default {
  log: make('log', log),
  info: make('info', info),
  warn: make('warn', warn),
  error: make('error', error),
  confirm,
  task,
};
