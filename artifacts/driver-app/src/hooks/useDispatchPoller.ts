import { useGetMyPendingDispatch, getGetMyPendingDispatchQueryKey } from "@workspace/api-client-react";

interface PendingDispatch {
  deliveryId: number;
  phase: string;
  secondsLeft: number;
}

export function useDispatchPoller(delivererId: number): PendingDispatch | null {
  const { data } = useGetMyPendingDispatch(
    { delivererId },
    {
      query: {
        queryKey: getGetMyPendingDispatchQueryKey({ delivererId }),
        refetchInterval: 4000,
      },
    }
  );

  if (!data || !data.hasPending || !data.delivery) {
    return null;
  }

  return {
    deliveryId: data.delivery.id,
    phase: data.phase ?? "primary",
    secondsLeft: data.secondsLeft ?? 60,
  };
}
