/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'Domain files must not import from infrastructure, presentation, main, or any node_modules. ' +
        'If a domain file needs an external capability, declare a port in application/ports/.',
      from: { path: '^src/[^/]+/domain', pathNot: '__(tests|spec)__|\\.test\\.' },
      to: {
        path: 'node_modules|^src/[^/]+/(infrastructure|presentation)|^src/main',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
