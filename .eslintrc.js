module.exports = {
  ignorePatterns: ['dist'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    /** 関数の返り値の型の明記を必須にしない */
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    /** シングルクォーテーション（''）とセミコロン（;）が無ければエラー */
    'prettier/prettier': ['error', { singleQuote: true, semi: true, printWidth: 120 }],
    /** anyは許容 */
    '@typescript-eslint/no-explicit-any': 'off',
    /** アルファベット順 */
    'sort-imports': 0,
    'import/order': [2, { alphabetize: { order: 'asc' } }],
    /** 相対パスでも可 */
    'import/no-unresolved': 'off',
    /** エスケープは許容 */
    'no-useless-escape': 'off',
    /** 同じ変数名はエラー */
    // 'no-shadow': 'error',
  },
};
