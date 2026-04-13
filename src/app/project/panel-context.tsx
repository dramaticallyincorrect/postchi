import { createContext, useContext, useState } from "react";

export type EditorParams = { path: string; };
export type FolderSettingsParams = { path: string; };


export type ViewState =
    | { type: 'EDITOR'; params: EditorParams }
    | { type: 'FOLDER_SETTINGS'; params: FolderSettingsParams }
    | { type: 'IMPORT'; params: undefined }
    | { type: 'SOURCE_TOKENS'; params: null }

export interface PanelContextType {
    viewState: ViewState | null;
    openView: (state: ViewState | null) => void;
    openEditor: (path: string) => void;
    goBack: () => void;
    goForward: () => void;
    canGoBack: boolean
    canGoForward: boolean
}


const PanelContext = createContext<PanelContextType>({
    viewState: null,
    openView: () => { },
    openEditor() { },
    goBack: () => { },
    goForward: () => { },
    canGoBack: false,
    canGoForward: false,
})

const forwardHistory: (ViewState | null)[] = []
const navigationHistory: (ViewState | null)[] = []

export const PanelProvider = ({ initialState, children }: { initialState: ViewState | null; children: React.ReactNode }) => {
    const [viewState, setViewState] = useState<ViewState | null>(initialState);

    const openView = (state: ViewState | null) => {
        navigationHistory.push(state);
        forwardHistory.splice(0)
        setViewState(state)
    };

    const openEditor = (path: string) => {
        openView({
            type: 'EDITOR',
            params: {
                path: path
            }
        })
    }

    const goBack = () => {
        if (navigationHistory.length > 1) {
            forwardHistory.push(navigationHistory.pop()!)
            setViewState(navigationHistory[Math.max(0, navigationHistory.length - 1)])
        }
    }

    const goForward = () => {
        if (forwardHistory.length > 0) {
            navigationHistory.push(forwardHistory.pop()!)
            setViewState(navigationHistory[Math.max(0, navigationHistory.length - 1)])
        }
    }

    return <PanelContext.Provider value={{ viewState, openView, openEditor, goBack, goForward, canGoBack: navigationHistory.length > 1, canGoForward: forwardHistory.length > 0 }}>
        {children}
    </PanelContext.Provider>
};

export const usePanel = () => {
    const ctx = useContext(PanelContext);
    if (!ctx) throw new Error('usePanel must be used within PanelProvider');
    return ctx;
}