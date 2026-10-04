import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parkingApi, queryKeys } from '@/api';
import { useFrozenPosition } from '@/features/location/hooks';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useLanguage } from '@/shared/i18n';
import { roundLatLng } from '@/shared/lib/geo';

export function useDestinationSearch(rawQuery: string) {
  const query = useDebouncedValue(rawQuery.trim(), 250);
  const near = roundLatLng(useFrozenPosition(), 2);
  const { language } = useLanguage();

  const result = useQuery({
    queryKey: [...queryKeys.destinations({ query, near }), language],
    queryFn: ({ signal }) => parkingApi.searchDestinations({ query, near }, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return { ...result, query, isTyping: query !== rawQuery.trim() };
}
