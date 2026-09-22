import { toast } from 'sonner';

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.message || fallback;
}
export const fieldErrors = (err) => (err?.details && typeof err.details === 'object' ? err.details : {});
export const notifyError = (err, fallback) => toast.error(getErrorMessage(err, fallback));
