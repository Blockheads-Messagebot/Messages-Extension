import typescript from 'rollup-plugin-typescript2'
import string from 'rollup-plugin-string'

export default {
    input: 'src/index.ts',
    output: {
        file: 'index.js',
        format: 'umd',
    },
    plugins: [
        typescript(),
        string({ include: ['**/*.html', '**/*.css'] })
    ],
    external: [
        '@bhmb/bot'
    ],
    globals: {
        '@bhmb/bot': '@bhmb/bot'
    }
}
