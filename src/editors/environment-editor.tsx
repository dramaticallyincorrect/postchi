import CodeMirror from '@uiw/react-codemirror';
import { useFileText } from './use-auto-save';
import { lintGutter } from '@codemirror/lint';
import { autocompletion } from '@codemirror/autocomplete';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { themes } from '@/lib/theme/themes';
import { useEnvironment } from '@/active-environment/environment-context';
import DefaultFileStorage from '@/lib/data/files/file-default';

export const EnvironmentEditor = ({ path }: { path: string }) => {

    const { text, setText } = useFileText(path)

    const { reload } = useEnvironment()

    const onChange = (value: string) => {
        setText(value)
        new DefaultFileStorage().writeText(path, value).then(() => {
            reload()
        })
    }

    //TODO: get theme from context
    const theme = themes[1]


    return <CodeMirror
        value={text}
        onChange={onChange}
        height='100%'
        theme={buildCMTheme(environmentSyntaxHighlighting(theme), theme.editor)}
        className='height: 100% outline-none'
        extensions={[lintGutter(), EnvironmentsLanguage(), autocompletion()]}
    />
}