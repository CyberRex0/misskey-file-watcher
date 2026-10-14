import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import love from 'eslint-config-love';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

const sourceFiles = ['**/*.ts', '**/*.vue'];

export default [
    { ignores: ['dist/**'] },
    js.configs.recommended,
    ...tsPlugin.configs['flat/recommended'].map(config => ({
        ...config,
        files: sourceFiles,
    })),
    { ...love, files: sourceFiles },
    ...vue.configs['flat/essential'],
    {
        files: sourceFiles,
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                parser: tsParser,
                projectService: true,
                extraFileExtensions: ['.vue'],
                tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)),
            },
        },
    },
    {
        files: ['eslint.config.js'],
        languageOptions: { globals: globals.node },
    },
    prettier,
];
