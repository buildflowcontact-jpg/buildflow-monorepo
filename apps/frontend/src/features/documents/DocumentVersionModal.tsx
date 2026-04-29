import React, { useRef, useState } from 'react';

export function DocumentVersionModal({
  open,
  onClose,
  onSubmit,
  initialData
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { file: File; version_number?: number; is_bpe?: boolean }) => void;
  initialData?: { version_number?: number; is_bpe?: boolean };
}) {
  const [versionNumber, setVersionNumber] = useState(initialData?.version_number || 1);
  const [isBPE, setIsBPE] = useState(initialData?.is_bpe || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setVersionNumber(initialData?.version_number || 1);
    setIsBPE(initialData?.is_bpe || false);
  }, [initialData, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-bold text-lg mb-4">Nouvelle version du document</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            const file = fileInputRef.current?.files?.[0];
            if (file) {
              onSubmit({ file, version_number: versionNumber, is_bpe: isBPE });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Fichier</label>
            <input type="file" required ref={fileInputRef} accept="application/pdf,image/*" className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Numéro de version</label>
            <input
              type="number"
              min={1}
              value={versionNumber}
              onChange={e => setVersionNumber(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isBPE} onChange={e => setIsBPE(e.target.checked)} id="isBPE" />
            <label htmlFor="isBPE">Plan BPE</label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded font-bold">Uploader</button>
          </div>
        </form>
      </div>
    </div>
  );
}
