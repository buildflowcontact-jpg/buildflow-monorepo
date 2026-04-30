import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PDFViewer({ url }: { url: string }) {
    console.log('[LOG] PDFViewer url:', url);
  const [numPages, setNumPages] = React.useState<number | null>(null);

  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-auto">
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} width={800} />
        ))}
      </Document>
    </div>
  );
}
