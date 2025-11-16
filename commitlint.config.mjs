export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'tests', 'build', 'ci', 'chore', 'revert', 'types']
        ]
    }
};
