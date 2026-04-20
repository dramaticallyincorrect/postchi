import { describe, expect, it } from "vitest";
import { editorState, PanelState, TabsState } from "./panel-context";

describe('Tabs State', () => {

    it('open tab adds a new tab, no tab exists', () => {
        const tabs = new TabsState()

        const tab: PanelState = editorState('/path')

        const result = tabs.openTab(tab)

        expect(result.panels).toStrictEqual([tab])

    })

    it('open tab adds a new tab, some tabs exists', () => {
        const tab = editorState('/b')
        const tabs = new TabsState([tab])

        const tab2: PanelState = editorState('/path')

        const result = tabs.openTab(tab2)

        expect(result.panels).toStrictEqual([tab, tab2])

    })


    it('open tab sets tab as active if already exists', () => {

        const tab = editorState('/a')
        const tab2 = editorState('/b')
        const tab3 = editorState('/2')
        const tabs = new TabsState([tab, tab2, tab3], tab2)

        const result = tabs.openTab(tab)

        expect(result.panels).toStrictEqual([tab, tab2, tab3])

    })


    it('closes tab', () => {

        const tab = editorState('/a')
        const tabs = new TabsState([tab], tab)

        const result = tabs.closeTab(tab)

        expect(result.panels).toStrictEqual([])
        expect(result.active).toBeNull()
    })


    it('close active tab sets previous tab as active', () => {

        const tab = editorState('/a')
        const tab2 = editorState('/b')
        const tab3 = editorState('/c')
        const tabs = new TabsState([tab, tab2, tab3], tab3)

        const result = tabs.closeTab(tab)

        expect(result.panels).toStrictEqual([tab2, tab3])
        expect(result.active).toBe(tab2)

    })

    it('open sets state in active tab when no tab exists', () => {
        const tabs = new TabsState([], undefined)

        const newTab = editorState('/c')
        const result = tabs.open(newTab)

        expect(result.panels).toStrictEqual([newTab])
        expect(result.active).toBe(newTab)
    })

    it('open sets state in active tab', () => {
        const tab = editorState('/a')
        const tab2 = editorState('/b')
        const tabs = new TabsState([tab, tab2], tab2)

        const newTab = editorState('/c')
        const result = tabs.open(newTab)

        expect(result.panels).toStrictEqual([tab, newTab])
        expect(result.active).toBe(newTab)
    })

    it('open switches to existing tab when already opened', () => {
        const tab = editorState('/a')
        const tab2 = editorState('/b')
        const tabs = new TabsState([tab, tab2], tab2)

        const result = tabs.open(tab)

        expect(result.panels).toStrictEqual([tab, tab2])
        expect(result.active).toBe(tab)
    })

    describe('navigation history', () => {
        describe('open', () => {
            it('open adds to history', () => {

                const tabs = new TabsState()

                const tab: PanelState = editorState('/path')

                const result = tabs.open(tab)

                expect(result.navigationHistory).toStrictEqual([tab])

            })

            it('open already active does not add to history', () => {

                const tabs = new TabsState()

                const tab: PanelState = editorState('/path')

                const result = tabs.open(tab).open(tab)

                expect(result.navigationHistory).toStrictEqual([tab])

            })

            it('open adds to history when tab is already open', () => {

                const tab = editorState('/a')
                const tab2 = editorState('/b')
                const tabs = new TabsState([tab, tab2], tab2)

                const result = tabs.open(tab)

                expect(result.navigationHistory).toStrictEqual([tab])
            })

            it('open adds to history - tabs is not empty', () => {

                const tab = editorState('/a')
                const tab2 = editorState('/b')
                const tabs = new TabsState([tab], tab)

                const result = tabs.open(tab2)

                expect(result.navigationHistory).toStrictEqual([tab2])
            })
        })

        it('open tab ads to history', () => {
            const tabs = new TabsState()

            const tab: PanelState = editorState('/path')

            const result = tabs.openTab(tab)

            expect(result.navigationHistory).toStrictEqual([tab])
        })

        it('open already active tab does not add to history', () => {
            const tabs = new TabsState()

            const tab: PanelState = editorState('/path')

            const result = tabs.openTab(tab).openTab(tab)

            expect(result.navigationHistory).toStrictEqual([tab])
        })

        it('going back adds to forward history', () => {
            const tabs = new TabsState()

            const tab: PanelState = editorState('/path')
            const tab2 = editorState('/c')

            const result = tabs.open(tab).open(tab2).goBack()

            expect(result.navigationHistory).toStrictEqual([tab])
            expect(result.forwardHistory).toStrictEqual([tab2])

        })

        it('going forward removes from forward history', () => {


            const tab: PanelState = editorState('/path')
            const tab2 = editorState('/c')

            const tabs = new TabsState([tab], tab, [tab], [tab2])

            const result = tabs.goForward()

            expect(result.navigationHistory).toStrictEqual([tab, tab2])
            expect(result.forwardHistory).toStrictEqual([])

        })

        it('open removes forward history', () => {

            const tab: PanelState = editorState('/path')
            const tab2 = editorState('/c')

            const tabs = new TabsState([tab], tab, [tab], [tab2])

            const tab3 = editorState('/3')

            const result = tabs.open(tab3)

            expect(result.navigationHistory).toStrictEqual([tab, tab3])
            expect(result.forwardHistory).toStrictEqual([])

        })

        it('open tab removes forward history', () => {

            const tab: PanelState = editorState('/path')
            const tab2 = editorState('/c')

            const tabs = new TabsState([tab], tab, [tab], [tab2])

            const tab3 = editorState('/3')

            const result = tabs.openTab(tab3)

            expect(result.navigationHistory).toStrictEqual([tab, tab3])
            expect(result.forwardHistory).toStrictEqual([])

        })

    })

})