'use client';

import { BlockNoteSchema } from '@blocknote/core';

import { subdocBlock } from './subdoc-block';

export const blockNoteSchema = BlockNoteSchema.create().extend({
  blockSpecs: {
    subpage: subdocBlock(),
  },
});
