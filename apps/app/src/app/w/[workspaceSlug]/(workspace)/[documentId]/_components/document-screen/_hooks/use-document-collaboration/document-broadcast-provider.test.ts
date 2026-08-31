import { Awareness } from 'y-protocols/awareness';
import * as Yjs from 'yjs';

import { DocumentBroadcastProvider } from './document-broadcast-provider';

class TestChannel extends EventTarget {
  peer?: TestChannel;

  close() {}

  postMessage(message: unknown) {
    this.peer?.dispatchEvent(new MessageEvent('message', { data: message }));
  }
}

describe('DocumentBroadcastProvider', () => {
  it('merges document updates between local tabs without echoing indefinitely', () => {
    const firstDocument = new Yjs.Doc();
    const secondDocument = new Yjs.Doc();
    const firstChannel = new TestChannel();
    const secondChannel = new TestChannel();
    firstChannel.peer = secondChannel;
    secondChannel.peer = firstChannel;

    const firstProvider = new DocumentBroadcastProvider(
      firstDocument,
      new Awareness(firstDocument),
      firstChannel,
    );
    const secondProvider = new DocumentBroadcastProvider(
      secondDocument,
      new Awareness(secondDocument),
      secondChannel,
    );

    firstDocument.getText('content').insert(0, 'Hello');

    expect(secondDocument.getText('content').toString()).toBe('Hello');

    firstProvider.destroy();
    secondProvider.destroy();
  });
});
