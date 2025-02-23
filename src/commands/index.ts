import { defineCommandGroup } from './helpers/define';
import patchCommand from './patch';
import verifyCommand from './verify';

export default defineCommandGroup({
  name: 'next-ws',
  description: 'Patch the local Next.js installation to support WebSockets',
  children: [patchCommand, verifyCommand],
});
