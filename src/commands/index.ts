import { defineCommandGroup } from './helpers/define.js';
import patchCommand from './patch.js';
import verifyCommand from './verify.js';

export default defineCommandGroup({
  name: 'next-ws',
  description: 'Patch the local Next.js installation to support WebSockets',
  children: [patchCommand, verifyCommand],
});
