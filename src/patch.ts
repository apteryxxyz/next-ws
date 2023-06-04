import * as fs from 'node:fs/promises';
import generate from '@babel/generator';
import * as parser from '@babel/parser';
import template from '@babel/template';
import type { ClassDeclaration, ClassMethod } from '@babel/types';

void main();
async function main() {
    await patchNextNodeServer();
}

const mod = template.expression.ast`require("next-ws/server")`;

// Add `require('next-ws/server').hookNextNodeServer.call(this)` to the
// constructor of `NextNodeServer` in `next/dist/server/next-server.js`
async function patchNextNodeServer() {
    const filePath = require.resolve('next/dist/server/next-server');
    const content = await fs.readFile(filePath, 'utf8');
    const ast = parser.parse(content);

    const classDeclaration = ast.program.body.find(
        node =>
            node.type === 'ClassDeclaration' &&
            node.id.name === 'NextNodeServer'
    ) as ClassDeclaration | undefined;
    if (!classDeclaration) return;

    const constructorMethod = classDeclaration.body.body.find(
        node => node.type === 'ClassMethod' && node.kind === 'constructor'
    ) as ClassMethod | undefined;
    if (!constructorMethod) return;

    const statement = template.statement
        .ast`${mod}.hookNextNodeServer.call(this)`;
    const expression = generate(statement).code;

    // Ensure the statement is not already in the constructor
    const existingStatement = constructorMethod.body.body //
        .some(state => generate(state).code === expression);
    if (!existingStatement) constructorMethod.body.body.push(statement);

    await fs.writeFile(filePath, generate(ast).code);
}
