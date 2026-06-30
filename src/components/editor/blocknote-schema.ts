'use client';

import { BlockNoteSchema } from '@blocknote/core';

import { subpageBlock } from './subpage-block';

export const blockNoteSchema = BlockNoteSchema.create().extend({
  blockSpecs: {
    subpage: subpageBlock(),
  },
});
