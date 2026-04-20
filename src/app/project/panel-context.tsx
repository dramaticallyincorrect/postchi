import { createContext, useContext, useState } from "react";

export type EditorParams = { path: string; };
export type FolderSettingsParams = { path: string; };


export type ViewState =
    | { type: 'EDITOR'; params: EditorParams }
    | { type: 'FOLDER_SETTINGS'; params: FolderSettingsParams }
    | { type: 'IMPORT'; params: undefined }
    | { type: 'SOURCE_TOKENS'; params: null }

export type PanelState = {
    first: ViewState | null,
    second?: ViewState
}


export class TabsState {
    panels: PanelState[] = []
    active: PanelState | null
    forwardHistory: PanelState[] = []
    navigationHistory: PanelState[] = []

    constructor(panels: PanelState[] = [], active: PanelState | null = null, navigationHistory: PanelState[] = [], forwardHistory: PanelState[] = []) {
        this.panels = panels
        this.active = active
        this.navigationHistory = navigationHistory
        this.forwardHistory = forwardHistory
    }

    openTab(state: PanelState) {

        // no op if exists or add to end
        const insertionIndex = findTab(this, state) ?? this.panels.length

        this.panels[insertionIndex] = state

        return new TabsState(
            this.panels, state, this.withHistory(state)
        )
    }

    closeTab(state: PanelState) {
        console.log('remove ', state)
        const index = findTab(this, state)!
        this.panels.splice(index, 1)
        return new TabsState(
            this.panels,
            this.panels[Math.max(index - 1, 0)]
        )
    }

    open(state: PanelState) {
        const newPanels = this.setOrReplaceActiveState(state)
        return new TabsState(
            newPanels, state, this.withHistory(state)
        )
    }

    goBack() {
        if (this.navigationHistory.length > 0) {
            this.forwardHistory.push(this.navigationHistory.pop()!)
            const newState = this.navigationHistory[Math.max(0, this.navigationHistory.length - 1)]
            return new TabsState(
                this.panels, newState, this.navigationHistory, this.forwardHistory
            )
        }
        return this
    }

    goForward() {
        if (this.forwardHistory.length > 0) {
            this.navigationHistory.push(this.forwardHistory.pop()!)
            const newState = this.navigationHistory[Math.max(0, this.navigationHistory.length - 1)]
            return new TabsState(
                this.panels, newState, this.navigationHistory, this.forwardHistory
            )
        }
        return this
    }

    private withHistory(item: PanelState) {
        if (this.navigationHistory[this.navigationHistory.length - 1] != item) {
            this.navigationHistory.push(item)
        }
        return this.navigationHistory
    }

    private setOrReplaceActiveState(item: PanelState): PanelState[] {
        // if item is already in tabs, nothing happesn. if not set the item to where the active item is other wise (list is empty) set to zero
        const index = findTab(this, item) ?? findTab(this, this.active) ?? 0

        this.panels[index] = item
        return this.panels
    }
}

export interface PanelContextType {
    viewState: PanelState | null;
    tabs: TabsState,
    openView: (state: ViewState | PanelState | null) => void;
    openTab: (state: PanelState) => void;
    closeTab: (state: PanelState) => void;
    openEditor: (path: string) => void;
    goBack: () => void;
    goForward: () => void;
    canGoBack: boolean
    canGoForward: boolean
}


const PanelContext = createContext<PanelContextType>({
    viewState: null,
    tabs: new TabsState(),
    openView: () => { },
    openTab: () => { },
    closeTab: () => { },
    openEditor() { },
    goBack: () => { },
    goForward: () => { },
    canGoBack: false,
    canGoForward: false,
})

function findTab(tabs: TabsState, state: PanelState | null): number | null {
    if (state == null) return null
    const index = tabs.panels.findIndex((p) => isPanelStateEqual(p, state))
    return index >= 0 ? index : null
}

function isViewStateEqual(a: ViewState | null | undefined, b: ViewState | null | undefined): boolean {
    if (a === b) return true; // Handles both null/undefined if they are the same reference
    if (!a || !b) return false;
    if (a.type !== b.type) return false;

    // Type narrowing allows us to check params safely
    if (a.type === 'EDITOR' && b.type === 'EDITOR') {
        return a.params.path === b.params.path;
    }
    if (a.type === 'FOLDER_SETTINGS' && b.type === 'FOLDER_SETTINGS') {
        return a.params.path === b.params.path;
    }

    return true; // For IMPORT and SOURCE_TOKENS which have no variable params
}

function isPanelStateEqual(a: PanelState | null, b: PanelState): boolean {
    if (a == null) return false
    return isViewStateEqual(a.first, b.first) && isViewStateEqual(a.second, b.second);
}

export const PanelProvider = ({ initialState, children }: { initialState: ViewState | null; children: React.ReactNode }) => {

    const [tabs, setTabs] = useState<TabsState>(new TabsState([{
        first: initialState
    }]));

    const openView = (state: ViewState | PanelState | null) => {
        if (state == null) {
            return
        }

        let _state: PanelState


        if ('first' in state) {
            _state = state
        } else {
            _state = {
                first: state
            }
        }

        setTabs(tabs.open(_state))
    };


    const openTab = (state: PanelState) => {
        setTabs(
            tabs.openTab(state)
        )
    };


    const closeTab = (state: PanelState) => {
        setTabs(tabs.closeTab(state))
    };

    const openEditor = (path: string) => {
        openView({
            first: {
                type: 'EDITOR',
                params: {
                    path: path
                }
            }
        })
    }

    const goBack = () => {
        setTabs(tabs.goBack())
    }

    const goForward = () => {
        setTabs(tabs.goForward())
    }

    return <PanelContext.Provider value={{ viewState: tabs.active, tabs, openView, openTab, closeTab, openEditor, goBack, goForward, canGoBack: tabs.navigationHistory.length > 1, canGoForward: tabs.forwardHistory.length > 0 }}>
        {children}
    </PanelContext.Provider>
};

export const usePanel = () => {
    const ctx = useContext(PanelContext);
    if (!ctx) throw new Error('usePanel must be used within PanelProvider');
    return ctx;
}


export function editorState(path: string): PanelState {
    return {
        first: {
            type: 'EDITOR',
            params: {
                path: path
            }
        }
    }
}