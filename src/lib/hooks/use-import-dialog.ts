import { useEffect, useState } from 'react';
import { MENU_EVENTS, onMenuEvent } from '@/lib/menu/menu-events';

export function useImportDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return onMenuEvent(MENU_EVENTS.IMPORT_PROJECT, () => setOpen(true));
  }, []);

  return { open, setOpen };
}