import React, { useRef } from 'react';

export function IncidentRevisionModal({
  open,
  onClose,
  onSubmit,
  incident
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { file: File }) => void;
  incident: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-bold text-lg mb-4">Uploader une révision pour l'incident</h2>
        <div className="mb-2 text-sm text-gray-700">{incident?.description}</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const file = fileInputRef.current?.files?.[0];
            if (file) {
              onSubmit({ file });
            }
          }}
          className="space-y-4"
        >
          <input type="file" required ref={fileInputRef} accept="application/pdf,image/*" className="w-full" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded font-bold">Uploader</button>
          </div>
        </form>
      </div>
    </div>
  );
}
