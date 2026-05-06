import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const DocumentAny: any = Document;
  const PageAny: any = Page;

  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-auto">
      <DocumentAny file={url} onLoadSuccess={(data: { numPages: number }) => setNumPages(data.numPages)}>
        {Array.from(new Array(numPages), (el, index) => (
          <PageAny key={`page_${index + 1}`} pageNumber={index + 1} width={800} />
        ))}
      </DocumentAny>
    </div>
  );
}
