import CodeMirror from '@uiw/react-codemirror';
import { useAutoSave } from './use-auto-save';
import { lintGutter } from '@codemirror/lint';
import { autocompletion } from '@codemirror/autocomplete';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { themes } from '@/lib/theme/themes';

export const EnvironmentEditor = ({ path }: { path: string }) => {

    const { text, setText, save } = useAutoSave(path)

    //TODO: get theme from context
    const theme = themes[1]


    return <CodeMirror
        onBlur={save}
        value={text}
        onChange={setText}
        height='100%'
        theme={buildCMTheme(environmentSyntaxHighlighting(theme), theme.editor)}
        className='height: 100% outline-none'
        extensions={[lintGutter(), EnvironmentsLanguage(), autocompletion()]}
    />
}