import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                ResizeObserver: 'readonly',
                Node: 'readonly',
                Element: 'readonly',
                HTMLElement: 'readonly',
                KeyboardEvent: 'readonly',
                MouseEvent: 'readonly',
                WheelEvent: 'readonly',
                InputEvent: 'readonly',
                TouchEvent: 'readonly',
                Event: 'readonly',
                Date: 'readonly',
                Set: 'readonly',
                Map: 'readonly',
                Promise: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', '*.js', 'examples/**'],
    },
];
