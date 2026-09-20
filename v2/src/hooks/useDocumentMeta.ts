import { useEffect } from 'react';

/** Sets a real per-page <title> and meta description — no extra dependency needed for this. */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
}
