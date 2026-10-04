import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parkingApi, queryKeys, type LatLng, type ReportInput } from '@/api';
import { useUserPosition } from '@/features/location/hooks';
import { useLanguage } from '@/shared/i18n';
import { roundLatLng } from '@/shared/lib/geo';
import { reverseGeocode } from './lib/reverseGeocode';

const REPORTS_REFRESH_MS = 15_000;

export function useReports() {
  const { position } = useUserPosition();
  const params = { near: roundLatLng(position, 1) };
  const query = useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: ({ signal }) => parkingApi.getReports(params, signal),
    refetchInterval: REPORTS_REFRESH_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
  const reports = useMemo(() => query.data ?? [], [query.data]);
  const byId = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports]);
  return { ...query, reports, byId };
}

export function useReport(reportId: string | undefined) {
  const { byId, isPending, isError } = useReports();
  return { report: reportId ? byId.get(reportId) : undefined, isPending, isError };
}

export function useAddress(point: LatLng | null) {
  const { language } = useLanguage();
  const key = point ? roundLatLng(point, 4) : null;
  return useQuery({
    queryKey: ['address', key, language],
    queryFn: ({ signal }) => reverseGeocode(key!, signal),
    enabled: Boolean(key),
    staleTime: Infinity,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportInput) => parkingApi.submitReport(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allReports }),
  });
}
