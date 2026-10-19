import { useCallback, useState } from 'react';
import ConfirmDeleteBanner from '../components/ConfirmDeleteBanner';

interface DeleteRequestOptions {
  itemLabel?: string;
  message?: string;
  title?: string;
}

interface PendingDelete extends DeleteRequestOptions {
  onConfirm: () => void;
}

export function useConfirmDelete() {
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const requestDelete = useCallback((onConfirm: () => void, options?: DeleteRequestOptions) => {
    setPending({ onConfirm, ...options });
  }, []);

  const cancelDelete = useCallback(() => setPending(null), []);

  const confirmDelete = useCallback(() => {
    pending?.onConfirm();
    setPending(null);
  }, [pending]);

  const ConfirmDeleteDialog = (
    <ConfirmDeleteBanner
      isOpen={!!pending}
      title={pending?.title}
      message={pending?.message}
      itemLabel={pending?.itemLabel}
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
    />
  );

  return { requestDelete, ConfirmDeleteDialog };
}
