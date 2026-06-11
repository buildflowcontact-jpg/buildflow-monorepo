import React, { useRef, useEffect } from 'react';

export function IFCViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: any;
    let three: any;
    let ifcjs: any;
    async function loadIFC() {
      if (!containerRef.current) return;
      // Dynamically import ifc.js and three.js
      ifcjs = await import('web-ifc-viewer');
      three = await import('three');
      if (!ifcjs || !three) return;
      viewer = new ifcjs.IfcViewerAPI({ container: containerRef.current, backgroundColor: 0xf0f0f0 });
      await viewer.IFC.loadIfcUrl(url);
    }
    loadIFC();
    return () => {
      if (viewer) viewer.dispose();
    };
  }, [url]);

  return <div ref={containerRef} className="w-full h-[60vh] bg-gray-100 rounded-xl" />;
}
