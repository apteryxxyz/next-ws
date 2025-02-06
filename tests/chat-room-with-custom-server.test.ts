import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Chat Room with Custom Server', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  // biome-ignore lint/style/useSingleVarDeclarator: I do what I want
  let page1: Page, page2: Page;
  test.beforeEach(async ({ browser }) => {
    page1 = await browser.newPage();
    const context2 = await browser.newContext({ locale: 'fr-FR' });
    page2 = await context2.newPage();
  });
  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test('a user joins the chat and receives a welcome message', async () => {
    await page1.goto('/chat/simple');

    const welcome1 = await page1.textContent('li:first-child');
    expect(welcome1).toContain('Welcome to the chat!');
    expect(welcome1).toContain('There are no other users online');

    await page2.goto('/chat/simple');

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain('Welcome to the chat!');
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message', async () => {
    await page1.goto('/chat/simple');
    await page2.goto('/chat/simple');

    await page1.waitForTimeout(1000); // can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('A new user joined the chat');
  });

  test('a user sends a message and all users receive it', async () => {
    await page1.goto('/chat/simple');
    await page2.goto('/chat/simple');

    await page1.fill('input[name=author]', 'Alice');
    await page1.fill('input[name=content]', 'Hello, world!');
    await page1.click('button[type=submit]');

    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('You');
    expect(message1).toContain('Hello, world!');

    const message2 = await page2.textContent('li:last-child');
    expect(message2).toContain('Alice');
    expect(message2).toContain('Hello, world!');
  });
});

test.describe('Chat Room with Custom Server with Dynamic Socket Route', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  // biome-ignore lint/style/useSingleVarDeclarator: I do what I want
  let page1: Page, page2: Page;
  test.beforeEach(async ({ browser }) => {
    page1 = await browser.newPage();
    const context2 = await browser.newContext({ locale: 'fr-FR' });
    page2 = await context2.newPage();
  });
  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test('a user joins the chat and receives a welcome message with their dynamic value', async () => {
    await page1.goto('/chat/dynamic');

    const welcome1 = await page1.textContent('li:first-child');
    expect(welcome1).toContain('Welcome to the chat!');
    expect(welcome1).toContain('Your language is en-US');
    expect(welcome1).toContain('There are no other users online');

    await page2.goto('/chat/dynamic');

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain('Welcome to the chat!');
    expect(welcome2).toContain('Your language is fr-FR');
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message with their dynamic value', async () => {
    await page1.goto('/chat/dynamic');
    await page2.goto('/chat/dynamic');

    await page1.waitForTimeout(1000); // can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('A new user joined the chat');
    expect(message1).toContain('their language is fr-FR');
  });

  test('a user sends a message and all users receive it', async () => {
    await page1.goto('/chat/dynamic');
    await page2.goto('/chat/dynamic');

    await page1.fill('input[name=author]', 'Alice');
    await page1.fill('input[name=content]', 'Hello, world!');
    await page1.click('button[type=submit]');

    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('You');
    expect(message1).toContain('Hello, world!');

    const message2 = await page2.textContent('li:last-child');
    expect(message2).toContain('Alice');
    expect(message2).toContain('Hello, world!');
  });
});
