import { defineUserConfig, defaultTheme } from 'vuepress';

export default defineUserConfig({
  base: '/bwcx/',
  lang: 'zh-CN',
  title: 'bwcx',
  description: '轻量、渐进式、面向对象的 Node.js Web 框架',
  theme: defaultTheme({
    repo: 'TIT-Frontend/bwcx',
    docsBranch: 'master',
    docsDir: 'docs/docs',
    navbar: [],
    sidebar: [
      {
        text: '介绍',
        link: '/introduction/quick-start',
        collapsible: false,
        children: ['/introduction/quick-start'],
      },
      {
        text: '核心',
        link: '/core/app',
        collapsible: false,
        children: [
          '/core/app',
          '/core/di',
          '/core/controller',
          '/core/service',
          '/core/middleware',
          '/core/exception',
          '/core/validation',
          '/core/guard',
          '/core/response-handler',
          '/core/config',
          '/core/plugin',
        ],
      },
      {
        text: '前后端一体化开发',
        link: '/fusion/api',
        collapsible: false,
        children: ['/fusion/api'],
      },
      {
        text: '参考',
        link: '/references/decorators',
        collapsible: false,
        children: ['/references/decorators', '/references/api'],
      },
    ],
  }),
});
