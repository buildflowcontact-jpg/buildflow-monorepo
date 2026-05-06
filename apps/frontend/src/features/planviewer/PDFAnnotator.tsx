
import React from 'react';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup } from "react-pdf-highlighter";
import { Spinner } from '../../ui/Spinner';

export function PDFAnnotator({ url }: { url: string }) {
  const [highlights, setHighlights] = React.useState<any[]>([]);
  const Highlighter: any = PdfHighlighter;

  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-auto">
      <PdfLoader url={url} beforeLoad={<div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement du PDF…</span></div>}>
        {(pdfDocument: any) => (
          <Highlighter
            pdfDocument={pdfDocument}
            highlights={highlights}
            enableAreaSelection={() => false}
            onScrollChange={() => {}}
            scrollRef={() => {}}
            onSelectionFinished={(position: any, content: any, hideTipAndSelection: any, transformSelection: any) => (
              <Tip
                onOpen={transformSelection}
                onConfirm={(comment: { text: string; emoji: string }) => {
                  setHighlights([
                    ...highlights,
                    {
                      content,
                      position,
                      comment: { text: comment.text }
                    }
                  ]);
                  hideTipAndSelection();
                }}
              />
            )}
            highlightTransform={(highlight: any, index: number, setTip: any, hideTip: any, viewportToScaled: any, screenshot: any, isScrolledTo: boolean) => (
              <Popup
                popupContent={<div>{highlight.comment.text}</div>}
                onMouseOver={(content: any) => setTip(highlight, () => content)}
                onMouseOut={hideTip}
                key={index}
                children={<Highlight {...highlight} isScrolledTo={isScrolledTo} />}
              />
            )}
          />
        )}
      </PdfLoader>
    </div>
  );
}
