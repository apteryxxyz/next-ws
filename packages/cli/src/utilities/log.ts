import chalk from 'chalk';

function line(content: string) {
    // eslint-disable-next-line unicorn/no-unsafe-regex
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

export const log = { error, warn, info };
