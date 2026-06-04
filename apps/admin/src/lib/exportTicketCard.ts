import { downloadDataUrl } from '@/lib/downloadFile';

/** Rasterize a ticket card DOM node to PNG and download it. */
export async function exportTicketCardPng(
  element: HTMLElement,
  filename: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#000000',
    });
    downloadDataUrl(dataUrl, filename);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return { ok: false, error: message };
  }
}
