// Join / payout-required handling shared by Find and Create.
import { api } from './http';

export async function joinEvent(router, eventId, price) {
  try {
    await api.post(`/creator/events/${eventId}/join`, { price });
  } catch (err) {
    if (err.code === 'PAYOUT_REQUIRED') return router.push({ name: 'studio-payout', query: { next: router.currentRoute.value.fullPath } });
    if (err.status !== 409) throw err; // 409 = already joined → just open it
  }
  return router.replace({ name: 'studio-event', params: { id: eventId } });
}
