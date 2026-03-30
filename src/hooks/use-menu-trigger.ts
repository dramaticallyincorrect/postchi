import { MenuAction, onMenuEvent } from '@/app/menu/menu-events';
import { useEffect, useState } from 'react';

export function useMenuTrigger(action: MenuAction) {
    const [triggered, setTriggered] = useState(false);

    useEffect(() => {
        const unlisten = onMenuEvent(async (event) => {
            if (event === action) {
                setTriggered(true);
            }else {
                setTriggered(false);
            }
        })
        return unlisten
    }, [action])

    return [triggered, setTriggered] as const;
}