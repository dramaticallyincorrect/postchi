import { createContext, useContext, useState } from "react";

export type EditorParams = { path: string; };
export type FolderSettingsParams = { path: string; };


export type ViewState =
    | { type: 'EDITOR'; params: EditorParams }
    | { type: 'FOLDER_SETTINGS'; params: FolderSettingsParams }
    | { type: 'IMPORT'; params: undefined }

export interface PanelContextType {
    viewState: ViewState | null;
    openView: (state: ViewState | null) => void;
    openEditor: (path: string) => void;
}

const PanelContext = createContext<PanelContextType>({
    viewState: null,
    openView: () => { },
    openEditor() {},
})

export const PanelProvider = ({ initialState, children }: { initialState: ViewState | null; children: React.ReactNode }) => {
    const [viewState, setViewState] = useState<ViewState | null>(initialState);

    const openView = (state: ViewState | null) => setViewState(state);

    const openEditor = (path: string) => {
        openView({
            type: 'EDITOR',
            params: {
                path: path
            }
        })
    }

    return <PanelContext.Provider value={{ viewState, openView, openEditor }}>
        {children}
    </PanelContext.Provider>
};

export const usePanel = () => {
    const ctx = useContext(PanelContext);
    if (!ctx) throw new Error('usePanel must be used within PanelProvider');
    return ctx;
}