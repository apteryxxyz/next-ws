import chalk from 'chalk';

function line(content: string) {
  return content.replaceAll(/(?:\n\s*)+/g, ' ');
}

function error(message: string) {
  console.error(chalk.red(`[next-ws] ${line(message)}`));
}

function warn(message: string) {
  console.warn(chalk.yellow(`[next-ws] ${line(message)}`));
}

function info(message: string) {
  console.info(chalk.cyan(`[next-ws] ${line(message)}`));
}

export default { error, warn, info };
