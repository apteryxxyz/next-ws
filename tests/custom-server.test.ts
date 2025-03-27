import { type Page, expect, test } from '@playwright/test';

// biome-ignore lint/style/useSingleVarDeclarator: I do what I want
let page1: Page, page2: Page;
test.beforeEach(async ({ browser }) => {
  page1 = await browser.newPage();
  page2 = await browser.newPage();
});
test.afterEach(async () => {
  await page1.close();
  await page2.close();
});

test.use({ baseURL: 'http://localhost:3003' });

test.describe('Chat Room', () => {
  test('a user joins the chat and receives a welcome message', async () => {
    await page1.goto('/');

    const welcome1 = await page1.textContent('li:first-child');
    expect(welcome1).toContain('Welcome to the chat!');
    expect(welcome1).toContain('There are no other users online');

    await page2.goto('/');

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain('Welcome to the chat!');
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message', async () => {
    await page1.goto('/');
    await page2.goto('/');

    await page1.waitForTimeout(1000); // Can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('A new user joined the chat');
  });

  test('a user sends a message and all users receive it', async () => {
    await page1.goto('/');
    await page2.goto('/');

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

test.describe('Private Chat Room', () => {
  test('a user joins the chat and receives a welcome message with their dynamic value', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`/${code}`);

    const welcome1 = await page1.textContent('li:first-child');
    expect(welcome1).toContain(`Welcome to the ${code} chat!`);
    expect(welcome1).toContain('There are no other users online');

    await page2.goto(`/${code}`);

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain(`Welcome to the ${code} chat!`);
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message with their dynamic value', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`/${code}`);
    await page2.goto(`/${code}`);

    await page1.waitForTimeout(1000); // Can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain(`A new user joined the ${code} chat`);
  });

  test('a user sends a message and all users receive it', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`/${code}`);
    await page2.goto(`/${code}`);

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

/*
test.use({ baseURL: 'http://localhost:3001' });

// biome-ignore lint/style/useSingleVarDeclarator: I do what I want
let page1: Page, page2: Page;
test.beforeEach(async ({ browser }) => {
  page1 = await browser.newPage();
  page2 = await browser.newPage();
});
test.afterEach(async () => {
  await page1.close();
  await page2.close();
});

test.describe('Chat Room', () => {
  test('a user joins the chat and receives a welcome message', async () => {
    await page1.goto('/');

    const welcome1 = await page2.textContent('li:first-child');
    expect(welcome1).toContain('Welcome to the chat!');
    expect(welcome1).toContain('There are no other users online');

    await page2.goto('/');

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain('Welcome to the chat!');
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message', async () => {
    await page1.goto('/');
    await page2.goto('/');

    await page1.waitForTimeout(1000); // Can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('A new user joined the chat');
  });

  test('a user sends a message and all users receive it', async () => {
    await page1.goto('/');
    await page2.goto('/');

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

test.describe('Private Chat Room', () => {
  test('a user joins the chat and receives a welcome message with their dynamic value', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`/${code}`);

    const welcome1 = await page1.textContent('li:first-child');
    expect(welcome1).toContain(`Welcome to the ${code} chat!`);
    expect(welcome1).toContain('There are no other users online');

    await page2.goto(`/${code}`);

    const welcome2 = await page2.textContent('li:first-child');
    expect(welcome2).toContain(`Welcome to the ${code} chat!`);
    expect(welcome2).toContain('There is 1 other user online');
  });

  test('a new user joins the chat and all users receive a message with their dynamic value', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`${code}`);
    await page2.goto(`${code}`);

    await page1.waitForTimeout(1000); // Can take a moment
    const message1 = await page1.textContent('li:last-child');
    expect(message1).toContain('A new user joined the chat');
    expect(message1).toContain('their language is fr-FR');
  });

  test('a user sends a message and all users receive it', async () => {
    const code = Math.random().toString(16).slice(2, 6).toUpperCase();

    await page1.goto(`${code}`);
    await page2.goto(`${code}`);

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
*/
