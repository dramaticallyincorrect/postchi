import { useState, useEffect, useCallback } from 'react';
import { useFileWatch } from './file-watch';
import { pinnedPathForProject, Project } from '@/postchi/project/project';
import { FileTreeItem, readProjectFileTree } from '@/postchi/project/project-files';

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

    useFileWatch(pinnedPathForProject(project.path), refreshTree, { ignoreModified: false });

    return { tree, isLoading, refresh: refreshTree };
}