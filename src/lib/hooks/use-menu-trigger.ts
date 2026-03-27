import { useEffect, useState } from 'react';
import { MenuAction, onMenuEvent } from '../menu/menu-events';

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