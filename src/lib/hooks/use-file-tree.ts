import { useState, useEffect, useCallback } from 'react';
import { FileTreeItem, readProjectFileTree } from '../data/project-files';
import { useFileWatch } from './file-watch';
import { Project } from '../data/project/project';

export function useFileTree(project: Project) {
    const [tree, setTree] = useState<FileTreeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTree = useCallback(async () => {
        try {
            const data = await readProjectFileTree(project);
            setTree(data);
        } catch (err) {
            console.error("Failed to read file tree:", err);
        } finally {
            setIsLoading(false);
        }
    }, [project]);

    useEffect(() => {
        refreshTree();
    }, [refreshTree]);

    useFileWatch(project.path, refreshTree);

    return { tree, isLoading, refresh: refreshTree };
}