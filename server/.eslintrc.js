module.exports = {
    env: { node: true, es2021: true, jest: true },
    extends: ['eslint:recommended'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
        'no-console': 'warn',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prefer-const': 'error',
        'no-var': 'error',
        eqeqeq: ['error', 'always'],
        semi: ['error', 'always'],
        quotes: ['error', 'single'],
    },
};
