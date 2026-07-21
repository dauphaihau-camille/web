import {
  documentCollaborationChannelName,
  documentCollaborationStorageName,
} from './document-collaboration.constants';

describe('document collaboration resource names', () => {
  it('scopes IndexedDB persistence to the document identifier', () => {
    expect(documentCollaborationStorageName('document-1'))
      .toBe('camille:document:document-1');
  });

  it('scopes the local-tab channel to the document identifier', () => {
    expect(documentCollaborationChannelName('document-1'))
      .toBe('camille:document:document-1');
  });
});
