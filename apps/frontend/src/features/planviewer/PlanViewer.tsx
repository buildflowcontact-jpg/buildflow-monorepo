import { Spinner } from '../../ui/Spinner';
import React from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import QuickPinchZoom from 'react-quick-pinch-zoom';
import { PDFViewer } from './PDFViewer';
import { PDFAnnotator } from './PDFAnnotator';
import { IFCViewer } from './IFCViewer';
import { IFCAnnotator } from './IFCAnnotator';

export function useBPEPlan(projectId: string, documentId: string) {
  return useQuery({
    queryKey: ['bpe-plan', projectId, documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_bpe', true)
        .single();
      if (error) throw error;
      return data;
    }
  });
}

export function PlanViewer({ projectId, documentId }: { projectId: string; documentId: string }) {
  const { data: plan, isLoading } = useBPEPlan(projectId, documentId);
  if (isLoading) return <div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement du plan...</span></div>;
  if (!plan) return <div>Aucun plan BPE disponible.</div>;
  const publicUrl = supabase.storage.from('project-media').getPublicUrl(plan.file_url).data.publicUrl;
  const ext = plan.file_url.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return <PDFAnnotator url={publicUrl} />;
  }
  if (ext === 'ifc') {
    return <IFCAnnotator url={publicUrl} />;
  }
  // fallback image
  return (
    <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-hidden">
      <QuickPinchZoom>
        <img src={publicUrl} alt="Plan BPE" className="w-full h-full object-contain" />
      </QuickPinchZoom>
    </div>
  );
}
