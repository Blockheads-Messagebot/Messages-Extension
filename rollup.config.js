import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import string from 'rollup-plugin-string'

export default {
    input: 'src/index.ts',
    output: {
        file: 'index.js',
        format: 'es',
    },
    plugins: [
        resolve(),
        commonjs(),
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
