'use client';

import { create } from 'zustand';

type DocumentTitleDraftStore = {
  activeDocumentId: string | null;
  draftTitle: string | null;
  setDraftTitle: (documentId: string, title: string) => void;
  clearDraftTitle: (documentId?: string) => void;
};

export const useDocumentTitleDraftStore = create<DocumentTitleDraftStore>((set) => ({
  activeDocumentId: null,
  draftTitle: null,
  setDraftTitle: (documentId, title) => {
    set({
      activeDocumentId: documentId,
      draftTitle: title,
    });
  },
  clearDraftTitle: (documentId) => {
    set((state) => {
      if (documentId && state.activeDocumentId !== documentId) {
        return state;
      }

      return {
        activeDocumentId: null,
        draftTitle: null,
      };
    });
  },
}));
