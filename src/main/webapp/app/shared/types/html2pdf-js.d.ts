declare module 'html2pdf.js' {
  type Html2PdfInstance = {
    set: (options: Record<string, unknown>) => Html2PdfInstance;
    from: (source: HTMLElement | string) => Html2PdfInstance;
    save: () => Promise<void>;
  };

  type Html2PdfFactory = () => Html2PdfInstance;

  const html2pdf: Html2PdfFactory;

  export default html2pdf;
}
