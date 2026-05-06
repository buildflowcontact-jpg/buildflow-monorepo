import { Spinner } from '../../ui/Spinner';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QuickPinchZoom from 'react-quick-pinch-zoom';
import { emit } from '../../lib/events';

const PDFAnnotator = React.lazy(() => import('./PDFAnnotator').then((module) => ({ default: module.PDFAnnotator })));
const IFCAnnotator = React.lazy(() => import('./IFCAnnotator').then((module) => ({ default: module.IFCAnnotator })));

function ViewerLoader({ label }: { label: string }) {
  return (
    <div className="flex justify-center items-center py-8">
      <Spinner size={40} />
      <span className="ml-2">{label}</span>
    </div>
  );
}

interface DocumentVersionRecord {
  id: string;
  file_url: string;
  created_at?: string;
  is_bpe?: boolean;
  version_label?: string | null;
}

function formatVersionLabel(version: DocumentVersionRecord, index: number) {
  if (version.version_label) {
    return version.version_label;
  }

  return `Version ${index + 1}`;
}

export function useDocumentVersions(projectId: string, documentId: string) {
  return useQuery({
    queryKey: ['document-versions', projectId, documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentVersionRecord[];
    }
  });
}

function useSetActiveBPEVersion(projectId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { error: resetError } = await supabase
        .from('document_versions')
        .update({ is_bpe: false })
        .eq('document_id', documentId);

      if (resetError) {
        throw resetError;
      }

      const { data, error } = await supabase
        .from('document_versions')
        .update({ is_bpe: true })
        .eq('id', versionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await emit({
        type: 'DOCUMENT_APPROVED',
        payload: {
          documentId,
          revisionId: versionId,
          projectId,
        },
      });

      return data as DocumentVersionRecord;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document-versions', projectId, documentId] }),
        queryClient.invalidateQueries({ queryKey: ['bpe-plan', projectId, documentId] }),
      ]);
    },
  });
}

export function PlanViewer({ projectId, documentId }: { projectId: string; documentId: string }) {
  const { data: versions = [], isLoading } = useDocumentVersions(projectId, documentId);
  const setActiveBPEVersion = useSetActiveBPEVersion(projectId, documentId);
  const activePlan = useMemo(() => versions.find((version) => version.is_bpe) ?? null, [versions]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      setSelectedVersionId(activePlan?.id ?? versions[0].id);
    }
  }, [activePlan, selectedVersionId, versions]);

  useEffect(() => {
    if (selectedVersionId && !versions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(activePlan?.id ?? versions[0]?.id ?? null);
    }
  }, [activePlan, selectedVersionId, versions]);

  if (isLoading) return <div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement du plan...</span></div>;
  if (versions.length === 0) return <div>Aucune version de plan disponible pour ce document.</div>;

  const displayedPlan = versions.find((version) => version.id === selectedVersionId) ?? activePlan ?? versions[0];
  const publicUrl = supabase.storage.from('project-media').getPublicUrl(displayedPlan.file_url).data.publicUrl;
  const ext = displayedPlan.file_url.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Workflow BPE</p>
              <h3 className="text-lg font-black text-slate-900">{formatVersionLabel(displayedPlan, versions.findIndex((version) => version.id === displayedPlan.id))}</h3>
              <p className="text-sm text-slate-600">
                {activePlan?.id === displayedPlan.id ? 'Version BPE actuellement active.' : 'Version consultable, non encore promue en BPE.'}
              </p>
            </div>
            {activePlan?.id !== displayedPlan.id ? (
              <button
                type="button"
                disabled={setActiveBPEVersion.isPending}
                onClick={() => setActiveBPEVersion.mutate(displayedPlan.id)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
              >
                {setActiveBPEVersion.isPending ? 'Activation...' : 'Definir comme plan BPE'}
              </button>
            ) : (
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                BPE actif
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {versions.map((version, index) => {
              const isSelected = version.id === displayedPlan.id;
              const isActive = version.id === activePlan?.id;

              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={isSelected
                    ? 'rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-left'
                    : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-slate-300'}
                >
                  <div className="text-sm font-semibold text-slate-900">{formatVersionLabel(version, index)}</div>
                  <div className="text-xs text-slate-500">{version.created_at ? new Date(version.created_at).toLocaleString() : 'Date inconnue'}</div>
                  {isActive ? <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">BPE</div> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Suspense fallback={<ViewerLoader label="Chargement du viewer PDF..." />}>
          <PDFAnnotator url={publicUrl} />
        </Suspense>
      </div>
    );
  }
  if (ext === 'ifc') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Workflow BPE</p>
              <h3 className="text-lg font-black text-slate-900">{formatVersionLabel(displayedPlan, versions.findIndex((version) => version.id === displayedPlan.id))}</h3>
              <p className="text-sm text-slate-600">
                {activePlan?.id === displayedPlan.id ? 'Version BPE actuellement active.' : 'Version consultable, non encore promue en BPE.'}
              </p>
            </div>
            {activePlan?.id !== displayedPlan.id ? (
              <button
                type="button"
                disabled={setActiveBPEVersion.isPending}
                onClick={() => setActiveBPEVersion.mutate(displayedPlan.id)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
              >
                {setActiveBPEVersion.isPending ? 'Activation...' : 'Definir comme plan BPE'}
              </button>
            ) : (
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                BPE actif
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {versions.map((version, index) => {
              const isSelected = version.id === displayedPlan.id;
              const isActive = version.id === activePlan?.id;

              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={isSelected
                    ? 'rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-left'
                    : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-slate-300'}
                >
                  <div className="text-sm font-semibold text-slate-900">{formatVersionLabel(version, index)}</div>
                  <div className="text-xs text-slate-500">{version.created_at ? new Date(version.created_at).toLocaleString() : 'Date inconnue'}</div>
                  {isActive ? <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">BPE</div> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Suspense fallback={<ViewerLoader label="Chargement du viewer IFC..." />}>
          <IFCAnnotator url={publicUrl} />
        </Suspense>
      </div>
    );
  }
  // fallback image
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Workflow BPE</p>
            <h3 className="text-lg font-black text-slate-900">{formatVersionLabel(displayedPlan, versions.findIndex((version) => version.id === displayedPlan.id))}</h3>
            <p className="text-sm text-slate-600">
              {activePlan?.id === displayedPlan.id ? 'Version BPE actuellement active.' : 'Version consultable, non encore promue en BPE.'}
            </p>
          </div>
          {activePlan?.id !== displayedPlan.id ? (
            <button
              type="button"
              disabled={setActiveBPEVersion.isPending}
              onClick={() => setActiveBPEVersion.mutate(displayedPlan.id)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
            >
              {setActiveBPEVersion.isPending ? 'Activation...' : 'Definir comme plan BPE'}
            </button>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              BPE actif
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {versions.map((version, index) => {
            const isSelected = version.id === displayedPlan.id;
            const isActive = version.id === activePlan?.id;

            return (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelectedVersionId(version.id)}
                className={isSelected
                  ? 'rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-left'
                  : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-slate-300'}
              >
                <div className="text-sm font-semibold text-slate-900">{formatVersionLabel(version, index)}</div>
                <div className="text-xs text-slate-500">{version.created_at ? new Date(version.created_at).toLocaleString() : 'Date inconnue'}</div>
                {isActive ? <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">BPE</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full h-[60vh] bg-gray-100 rounded-xl overflow-hidden">
        <QuickPinchZoom onUpdate={() => {}}>
          <img src={publicUrl} alt="Plan BPE" className="w-full h-full object-contain" />
        </QuickPinchZoom>
      </div>
    </div>
  );
}
