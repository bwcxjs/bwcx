import path from 'path';
import fs from 'fs-extra';
import relative from 'relative';
import { concat as urlConcat } from 'urlconcat';
import globby from 'globby';
import { Project, CodeBlockWriter, QuoteKind, IndentationText } from 'ts-morph';
import debug from 'debug';
import chokidar from 'chokidar';
import { AnalysedRoute } from './interface';
import AbstractSourceAnalyser from './analysers/analyser.abstract';
import CopySourceAnalyser from './analysers/copy-analyser';
import ReferenceSourceAnalyser from './analysers/reference-analyser';
import { RouteGeneratorUtils } from './utils';
import { AnalyserWarning } from './exceptions';

const scanDbg = debug('bwcx:client:vue:route:gen:scan');
const analyseDbg = debug('bwcx:client:vue:route:gen:analyse');
const generateDbg = debug('bwcx:client:vue:route:gen:generate');
const PKG_NAME = 'bwcx-client-vue';
const PKG_COMMON_NAME = 'bwcx-common';

export interface BwcxClientVueRouteGeneratorOptions {
  /** 客户端目录路径 */
  clientDir: string;
  /** 公共目录路径 */
  commonDir: string;
  /** 要扫描的视图组件 globs */
  scanGlobs: string[];
  /** 指定使用的 Vue 主版本 */
  vueMajorVersion: '2' | '3';
  /**
   * 输出的前端 router 文件绝对路径
   * @default path.join(opts.clientDir, '.router/router.ts')
   */
  outClientRouterPath?: string;
  /**
   * 输出的 common router 文件绝对路径
   * @default path.join(opts.commonDir, 'router/client.router.ts')
   */
  outCommonRouterPath?: string;
  /**
   * 输出的前端 router d.ts 文件绝对路径
   * @default path.join(opts.clientDir, '.router/router-types.d.ts')
   */
  outClientRouterTypesPath?: string;
  /**
   * 代码生成模式
   * - `reference`：所有视图组件依赖的 route props 类均以引用导入（import）方式收集，类名不能重复，且不能位于视图组件内
   * - `copy`：所有视图组件依赖的 route props 类均以复制源码的方式收集，其必须位于 `ts` 或 `tsx` 语言的视图组件内。解析和依赖优化将比 `reference` 模式花费更多时间。不支持 watch
   * @default 'reference'
   */
  codegenMode?: 'reference' | 'copy';
}

export default class BwcxClientVueRouteGenerator {
  private opts: BwcxClientVueRouteGeneratorOptions;
  private project: Project;
  private commonProject: Project;
  private analysedRoutes: AnalysedRoute[] = [];
  private analysedRoutesTree: AnalysedRoute[] = [];
  private clientAppendedText = '';
  private commonAppendedText = '';
  private watcher: chokidar.FSWatcher;

  public get bwcxVueSpecifiedVersionPkg() {
    return `${PKG_NAME}${this.opts.vueMajorVersion || '3'}`;
  }

  public constructor(opts: BwcxClientVueRouteGeneratorOptions) {
    this.opts = { ...opts };
    if (!this.opts.outClientRouterPath) {
      this.opts.outClientRouterPath = path.join(opts.clientDir, '.router/router.ts');
    }
    if (!this.opts.outCommonRouterPath) {
      this.opts.outCommonRouterPath = path.join(opts.commonDir, 'router/client.router.ts');
    }
    if (!this.opts.outClientRouterTypesPath) {
      this.opts.outClientRouterTypesPath = path.join(opts.clientDir, '.router/router-types.d.ts');
    }
    if (!this.opts.codegenMode) {
      this.opts.codegenMode = 'reference';
    }
    const clientDirTsConfigExists = fs.existsSync(path.join(opts.clientDir, 'tsconfig.json'));
    this.project = new Project({
      tsConfigFilePath: clientDirTsConfigExists
        ? path.join(opts.clientDir, 'tsconfig.json')
        : undefined,
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true,
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
        useTrailingCommas: true,
      },
    });
    const commonDirTsConfigExists = fs.existsSync(path.join(opts.commonDir, 'tsconfig.json'));
    this.commonProject = new Project({
      tsConfigFilePath: commonDirTsConfigExists
        ? path.join(opts.commonDir, 'tsconfig.json')
        : undefined,
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true,
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
        useTrailingCommas: true,
      },
    });
  }

  private getImportPathFromLocation(from: string, location: string) {
    const loc = RouteGeneratorUtils.getRelativeFileModulePath(from, location);
    if (path.extname(loc) !== '.vue') {
      return loc.substr(0, loc.length - 4);
    }
    return loc;
  }

  private getModuleRelativePath(src: string, dest: string) {
    let res: string = relative(src, dest);
    if (res && !res.startsWith('.')) {
      res = `./${res}`;
    }
    const ext = path.extname(res);
    if (ext === '.js' || ext === '.ts') {
      res = res.substr(0, res.length - 3);
    } else if (ext === '.jsx' || ext === '.tsx') {
      res = res.substr(0, res.length - 4);
    }
    return res;
  }

  private removeStringLiteralQuotes(str: string) {
    return /^['\"`]{1}(.*)['\"`]{1}$/.exec(str)?.[1] || str;
  }

  private isFileContentHasNoChange(filePath: string, content: string) {
    let curContent: string;
    try {
      curContent = fs.readFileSync(filePath).toString();
    } catch (e) {}
    if (!curContent || curContent.length !== content.length) {
      return false;
    }
    return curContent === content;
  }

  private writeGeneratedContent(filePath: string, content: string) {
    if (this.isFileContentHasNoChange(filePath, content)) {
      return;
    }
    fs.writeFileSync(filePath, content);
  }

  private setRouteFullPathDeep = (route: AnalysedRoute, basePath: string = '') => {
    const curPath = this.removeStringLiteralQuotes(route.path);
    if (!curPath.startsWith('/')) {
      let concatRes = urlConcat(basePath || '', this.removeStringLiteralQuotes(route.path));
      if (concatRes.startsWith('//')) {
        concatRes.substr(1);
      }
      route.fullPath = concatRes;
    } else {
      route.fullPath = curPath;
    }
    if (Array.isArray(route.children)) {
      route.children.forEach((child) => this.setRouteFullPathDeep(child, route.fullPath));
    }
  };

  private sortRoutes = (routes: AnalysedRoute[]) => {
    routes.sort((a, b) => {
      const aPriority = Number(a.priority) || 0;
      const bPriority = Number(b.priority) || 0;
      return bPriority - aPriority;
    });
  };

  private sortRoutesDeep = (routes: AnalysedRoute[]) => {
    routes.forEach((route) => {
      if (Array.isArray(route.children)) {
        this.sortRoutesDeep(route.children);
      }
    });
    this.sortRoutes(routes);
  };

  private calculateRoutesTree(routes: AnalysedRoute[]) {
    const childrenMap = new Map<string, AnalysedRoute[]>();
    for (const analysedRoute of routes) {
      if (analysedRoute.childOf !== 'undefined') {
        // remove quotes
        const parentName = this.removeStringLiteralQuotes(analysedRoute.childOf);
        const currentChildren = childrenMap.get(parentName) || [];
        childrenMap.set(parentName, [...currentChildren, analysedRoute]);
        analysedRoute._ignored = true;
      }
    }
    for (const parent of childrenMap.keys()) {
      const parentRoute = routes.find((r) => r.name === parent);
      if (!parentRoute) {
        console.warn(
          `Parent route name "${parent}" cannot find. All children of it will be ignored`,
        );
        continue;
      }
      parentRoute.children = childrenMap.get(parent);
      parentRoute.children.forEach((child) => (child.parent = parentRoute));
    }
    const routesTree = routes.filter((r) => !r._ignored);
    routesTree.forEach((r) => this.setRouteFullPathDeep(r));
    this.sortRoutesDeep(routesTree);
    return routesTree;
  }

  private generateClientRouter() {
    const genRouteConfig = (route: AnalysedRoute, indent = 0) => {
      const writer = new CodeBlockWriter({
        indentNumberOfSpaces: 2,
      });
      writer.setIndentationLevel(indent).block(() => {
        writer.writeLine(`name: '${route.name}',`);
        writer.writeLine(`path: ${route.path},`);
        writer.writeLine(`fullPath: '${route.fullPath}',`);
        writer.writeLine(
          `component: () => import(/* webpackChunkName: "${
            route.name
          }" */ '${this.getImportPathFromLocation(
            this.opts.outClientRouterPath,
            route.location,
          )}'),`,
        );
        writer.writeLine(`routeProps: ${route.routeProps},`);
        writer.writeLine(`priority: ${route.priority},`);
        writer.writeLine(`renderMethod: ${route.renderMethod},`);
        if (Array.isArray(route.children) && route.children.length > 0) {
          writer.writeLine(`children: [`);
          route.children.forEach((child) => {
            writer.writeLine(`${genRouteConfig(child, indent)},`);
          });
          writer.writeLine(`],`);
        }
        writer.writeLine(`otherOptions: ${route.otherOptions},`);
      });
      return writer.toString();
    };

    const clientRouterText = `import { parseRoutes } from '${this.bwcxVueSpecifiedVersionPkg}';
${this.clientAppendedText}

const clientRoutes = parseRoutes([
${
  this.analysedRoutesTree.length === 0
    ? ''
    : this.analysedRoutesTree.map((r) => genRouteConfig(r, 1)).join(',\n') + ','
}
]);

export default clientRoutes;\n`;
    const clientRouterSourceFile = this.project.createSourceFile(
      `${this.opts.outClientRouterPath}.temp-${Date.now()}.ts`,
      clientRouterText,
    );
    clientRouterSourceFile.organizeImports();
    const generatedClientRouterContent = `/**
 * This file was automatically generated by \`${PKG_NAME}\`.
 * DO NOT MODIFY IT BY HAND.
 */

${clientRouterSourceFile.getText()}
`;
    generateDbg('organized client router imports');
    generateDbg('write client router: %O', this.opts.outClientRouterPath);
    fs.ensureFileSync(this.opts.outClientRouterPath);
    this.writeGeneratedContent(this.opts.outClientRouterPath, generatedClientRouterContent);
  }

  private generateCommonRouter() {
    const commonRouterText = `${this.commonAppendedText}

export const clientRoutesMap = new Map<string, { path: string; routeProps: Newable | undefined; renderMethod: RenderMethodKind | undefined }>([
${this.analysedRoutes
  .map(
    (r) =>
      `  ['${r.name}', { path: '${r.fullPath}', routeProps: ${r.routeProps}, renderMethod: ${r.renderMethod} }],`,
  )
  .join('\n')}
]);`;
    const commonRouterSourceFile = this.commonProject.createSourceFile(
      `${this.opts.outCommonRouterPath}.temp-${Date.now()}.ts`,
      commonRouterText,
    );
    commonRouterSourceFile.organizeImports();
    let commonRouterOptimizedText = commonRouterSourceFile.getText();
    if (this.opts.codegenMode !== 'copy') {
      const appendRoutePropsExports: string[] = [];
      commonRouterOptimizedText.split('\n').forEach((l) => {
        const line = l.trim();
        if (/^import/.test(line)) {
          appendRoutePropsExports.push(line.replace(/^import/, 'export'));
        }
      });
      commonRouterOptimizedText = `${commonRouterOptimizedText}\n${appendRoutePropsExports.join(
        '\n',
      )}`;
    }

    const generatedCommonRouterContent = `/**
 * This file was automatically generated by \`${PKG_NAME}\`.
 * DO NOT MODIFY IT BY HAND.
 */

import { Newable } from '${PKG_COMMON_NAME}';
import { RenderMethodKind } from '${PKG_NAME}/enums';
${commonRouterOptimizedText}
`;
    generateDbg('organized common router imports');
    generateDbg('write common router: %O', this.opts.outCommonRouterPath);
    fs.ensureFileSync(this.opts.outCommonRouterPath);
    this.writeGeneratedContent(this.opts.outCommonRouterPath, generatedCommonRouterContent);
  }

  private generateClientRouterTypes() {
    const vueVersion = this.opts.vueMajorVersion;
    const routerRelativePath = this.getModuleRelativePath(
      this.opts.outClientRouterTypesPath,
      this.opts.outCommonRouterPath,
    );
    let generatedRouterTypesContent = '';
    switch (vueVersion) {
      case '2':
        generatedRouterTypesContent = `/**
 * This file was automatically generated by \`${PKG_NAME}\`.
 * DO NOT MODIFY IT BY HAND.
 */

import Vue from 'vue';
import { BwcxVueRouterActions } from '${this.bwcxVueSpecifiedVersionPkg}';
import * as R from '${routerRelativePath}';

declare module 'vue/types/vue' {
  interface Vue {
    $$router: {
${this.analysedRoutes
  .map(
    (r) =>
      `      to(target: '${r.name}'): BwcxVueRouterActions${
        r.routeProps && r.routeProps !== 'undefined' ? `<R.${r.routeProps}>` : ''
      };`,
  )
  .join('\n')}
    };
  }
}
`;
        break;
      case '3':
        generatedRouterTypesContent = `/**
 * This file was automatically generated by \`${PKG_NAME}\`.
 * DO NOT MODIFY IT BY HAND.
 */

import '@vue/runtime-core';
import { BwcxVueRouterActions } from '${this.bwcxVueSpecifiedVersionPkg}';
import * as R from '${routerRelativePath}';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $$router: {
${this.analysedRoutes
  .map(
    (r) =>
      `      to(target: '${r.name}'): BwcxVueRouterActions${
        r.routeProps && r.routeProps !== 'undefined' ? `<R.${r.routeProps}>` : ''
      };`,
  )
  .join('\n')}
    };
  }
}
`;
        break;
    }
    generateDbg('write client router types: %O', this.opts.outClientRouterTypesPath);
    fs.ensureFileSync(this.opts.outClientRouterTypesPath);
    this.writeGeneratedContent(this.opts.outClientRouterTypesPath, generatedRouterTypesContent);
  }

  private generate() {
    this.generateClientRouter();
    this.generateCommonRouter();
    this.generateClientRouterTypes();
  }

  private parse(filePaths: string[]) {
    const curAnalysedRoutes: AnalysedRoute[] = [];
    let curClientAppendedText = '';
    let curCommonAppendedText = '';
    for (const file of filePaths) {
      analyseDbg('analyse file: %O', path.relative(this.opts.clientDir, file));
      let sa: AbstractSourceAnalyser;
      if (this.opts.codegenMode === 'copy') {
        sa = new CopySourceAnalyser(
          file,
          this.project,
          this.opts.outClientRouterPath,
          this.opts.outCommonRouterPath,
        );
      } else {
        sa = new ReferenceSourceAnalyser(
          file,
          this.project,
          this.opts.outClientRouterPath,
          this.opts.outCommonRouterPath,
        );
      }
      try {
        const [clientAppendedText, commonAppendedText, analysedRoute] = sa.analyseSource();
        curClientAppendedText += clientAppendedText;
        curCommonAppendedText += commonAppendedText;
        curAnalysedRoutes.push(analysedRoute);
      } catch (e) {
        if (e instanceof AnalyserWarning || e.isWarning) {
          console.warn(`${e.message} (file: ${path.relative(process.cwd(), file)})`);
        } else {
          console.error(
            `Error occurred while analysing file ${path.relative(process.cwd(), file)}:`,
            e,
          );
        }
      }
    }
    return {
      curAnalysedRoutes,
      curClientAppendedText,
      curCommonAppendedText,
    };
  }

  public scanFiles(): string[] {
    return globby.sync(this.opts.scanGlobs, { cwd: this.opts.clientDir }).map((g) => {
      scanDbg('hit: %O', g);
      return path.join(this.opts.clientDir, g);
    });
  }

  public incrementalGenerate(event: 'add' | 'change' | 'unlink', filePath: string) {
    const startAt = Date.now();
    const analysedRoutes = [...this.analysedRoutes];
    if (event === 'unlink') {
      const index = analysedRoutes.findIndex((route) => route.location === filePath);
      analysedRoutes.splice(index, 1);
    } else {
      const { curAnalysedRoutes, curClientAppendedText, curCommonAppendedText } = this.parse([
        filePath,
      ]);
      curAnalysedRoutes.forEach((cur) => {
        const index = analysedRoutes.findIndex((route) => route.name === cur.name);
        if (index >= 0) {
          analysedRoutes[index] = cur;
        } else {
          analysedRoutes.push(cur);
        }
      });
      this.clientAppendedText = curClientAppendedText + this.clientAppendedText;
      this.commonAppendedText = curCommonAppendedText + this.commonAppendedText;
    }
    this.analysedRoutes = analysedRoutes;
    this.analysedRoutesTree = this.calculateRoutesTree(this.analysedRoutes);
    generateDbg('calculated routes tree: %O', this.analysedRoutesTree);
    this.generate();
    console.log(
      `Generated ${this.analysedRoutes.length} client route(s)`,
    );
  }

  public fullGenerate() {
    const startAt = Date.now();
    this.analysedRoutes = [];
    this.analysedRoutesTree = [];
    this.clientAppendedText = '';
    this.commonAppendedText = '';
    const filePaths = this.scanFiles();
    const { curAnalysedRoutes, curClientAppendedText, curCommonAppendedText } =
      this.parse(filePaths);
    this.analysedRoutes = curAnalysedRoutes;
    this.analysedRoutesTree = this.calculateRoutesTree(this.analysedRoutes);
    this.clientAppendedText = curClientAppendedText;
    this.commonAppendedText = curCommonAppendedText;
    generateDbg('calculated routes tree: %O', this.analysedRoutesTree);
    this.generate();
    console.log(`Generated ${this.analysedRoutes.length} client route(s)`);
  }

  public watch() {
    this.watcher = chokidar
      .watch(this.opts.scanGlobs, {
        ignoreInitial: true,
        cwd: this.opts.clientDir,
      })
      .on('all', (eventName, filePath) => {
        if (eventName === 'add' || eventName === 'change' || eventName === 'unlink') {
          const absFilePath = path.join(this.opts.clientDir, filePath);
          console.log(`File ${eventName}: ${path.relative(process.cwd(), absFilePath)}`);
          this.incrementalGenerate(eventName, absFilePath);
        }
      });
  }
}
