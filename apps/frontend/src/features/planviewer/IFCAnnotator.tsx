
import { Spinner } from '../../ui/Spinner';

export function IFCAnnotator({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProps, setSelectedProps] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let viewer: any;
    let ifcjs: any;
    let selectedModel: any;
    let selectedExpressID: number | null = null;
    async function loadIFC() {
      if (!containerRef.current) return;
      ifcjs = await import('web-ifc-viewer');
      viewer = new ifcjs.IfcViewerAPI({ container: containerRef.current, backgroundColor: 0xf0f0f0 });
      await viewer.IFC.loadIfcUrl(url);
      setLoading(false);
      viewer.IFC.selector.pickIfcItem = async (mesh, id, modelID) => {
        selectedExpressID = id;
        const props = await viewer.IFC.getProperties(modelID, id, true, false);
        setSelectedProps(props);
      };
    }
    loadIFC();
    return () => {
      if (viewer) viewer.dispose();
    };
  }, [url]);

  const handleScreenshot = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (canvas) {
      setScreenshot(canvas.toDataURL('image/png'));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement de la maquette IFC…</span></div>;
  }
  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl flex">
      <div ref={containerRef} className="flex-1 h-full" />
      <div className="w-80 p-2 bg-white border-l h-full overflow-auto">
        {selectedProps && (
          <>
            <h3 className="font-bold mb-2">Propriétés de l'élément</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto">{JSON.stringify(selectedProps, null, 2)}</pre>
            <button onClick={handleScreenshot} className="mt-2 px-2 py-1 bg-blue-600 text-white rounded">Capturer l'écran</button>
            {screenshot && (
              <div className="mt-2">
                <img src={screenshot} alt="screenshot" className="w-full border" />
                <textarea
                  className="w-full mt-2 p-1 border rounded"
                  placeholder="Ajouter une note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}
          </>
        )}
        {!selectedProps && <div className="text-gray-400">Sélectionnez un objet dans la maquette</div>}
      </div>
    </div>
  );
}
