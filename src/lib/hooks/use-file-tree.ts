import { useState, useEffect, useCallback } from 'react';
import { FileTreeItem, readFileTree } from '../data/project-files';
import { useFileWatch } from './file-watch';

export function useFileTree(rootPath: string) {
    const [tree, setTree] = useState<FileTreeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTree = useCallback(async () => {
        try {
            const data = await readFileTree(rootPath);
            setTree(data);
        } catch (err) {
            console.error("Failed to read file tree:", err);
        } finally {
            setIsLoading(false);
        }
    }, [rootPath]);

    useEffect(() => {
        refreshTree();
    }, [refreshTree]);

    useFileWatch(rootPath, refreshTree);

    return { tree, isLoading, refresh: refreshTree };
}