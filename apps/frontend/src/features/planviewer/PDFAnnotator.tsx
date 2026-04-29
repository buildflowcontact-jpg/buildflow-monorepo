
import React from 'react';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup } from "react-pdf-highlighter";
import { Spinner } from '../../ui/Spinner';

export function PDFAnnotator({ url }: { url: string }) {
  const [highlights, setHighlights] = React.useState<any[]>([]);

  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-auto">
      <PdfLoader url={url} beforeLoad={<div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement du PDF…</span></div>}>
        {pdfDocument => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            highlights={highlights}
            onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => (
              <Tip
                onOpen={transformSelection}
                onConfirm={comment => {
                  setHighlights([
                    ...highlights,
                    {
                      content,
                      position,
                      comment: { text: comment }
                    }
                  ]);
                  hideTipAndSelection();
                }}
              />
            )}
            highlightTransform={(highlight, index, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => (
              <Popup
                popupContent={<div>{highlight.comment.text}</div>}
                onMouseOver={setTip}
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
