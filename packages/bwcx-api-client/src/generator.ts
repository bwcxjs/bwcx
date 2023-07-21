import { getApiMetadata } from 'bwcx-api';
import { getDtoMetadata } from 'bwcx-common';
import type { Newable } from 'bwcx-common';
import debug from 'debug';
import { locate, clean as cleanFuncLoc } from 'func-loc';
import path from 'path';
import fs from 'fs-extra';

const apiClientGeneratorDebug = debug('bwcx:api-client:generator');
const PKG_NAME = 'bwcx-api-client';

export interface IApiClientGeneratorOptions {
  outFilePath: string;
  prependImports?: string[];
  enableExtraReqOptions?: boolean;
  filter?(options: {
    controller: Newable;
    controllerPath: string;
    routeData: IApiClientGeneratorRouteData;
  }): boolean;
}

export interface IApiClientGeneratorRouteMetadata {
  name: string;
  method: string;
  path: string;
  contract: {
    req: Newable | null | undefined;
    resp: Newable | null | undefined;
  };
}

export interface IApiClientGeneratorRouteData {
  metadata: IApiClientGeneratorRouteMetadata;
  propertyKey: string;
}

export interface IApiClientGereratorAppRouterDataItem {
  controller: Newable;
  path: string;
  routes: IApiClientGeneratorRouteData[];
}

export class ApiClientGenerator {
  /** <path, Set<item>> */
  private importsMap = new Map<string, Set<string>>();
  private aIndex = -1;

  public constructor(
    private readonly config: IApiClientGeneratorOptions,
    private readonly routerData: IApiClientGereratorAppRouterDataItem[],
  ) {}

  public async generate() {
    const apiMethodGen: string[] = [];
    const apiReqArgsGen: string[] = [];
    const router = this.routerData;
    for (const r of router) {
      const { controller } = r;
      let { path: controllerPath } = r;
      for (const routeData of r.routes) {
        if (
          typeof this.config.filter === 'function' &&
          !this.config.filter({ controller, controllerPath, routeData })
        ) {
          continue;
        }
        const { propertyKey: route, metadata } = routeData;
        const { req, resp } = metadata.contract;
        const apiMetadata = getApiMetadata(controller, route);
        const { summary } = apiMetadata;
        if (
          !summary ||
          metadata.contract.req === undefined ||
          metadata.contract.resp === undefined
        ) {
          continue;
        }
        if (!controllerPath || controllerPath === '/') {
          controllerPath = '';
        } else if (!controllerPath.startsWith('/')) {
          controllerPath = '/' + controllerPath;
        }
        let routePath = metadata.path;
        if (!routePath) {
          routePath = '/';
        } else if (!routePath.startsWith('/')) {
          routePath = '/' + routePath;
        }
        const fullPath = controllerPath + routePath;
        this.aIndex++;
        const { fields: reqFields, fileFields: reqFileFields } = getDtoMetadata(req);
        const hasFileFields = reqFileFields.length > 0;
        const reqParamTypeMap: Record<string, 'param' | 'query' | 'body'> = {};
        const reqParamSourceMap: Record<'param' | 'query' | 'body', string[]> = {
          param: [],
          query: [],
          body: [],
        };
        reqFields.forEach((field) => {
          const { type, property } = field;
          reqParamTypeMap[property] = type;
          switch (type) {
            case 'param':
            case 'query':
            case 'body':
              reqParamSourceMap[type].push(property);
          }
        });
        if (req) {
          const reqDtoLoc = await this.getFuncLocation(req);
          this.saveImports(
            path
              .relative(path.normalize(this.config.outFilePath + '/..'), reqDtoLoc.path)
              .replace(/\\/g, '/'),
            req.name,
          );
        }
        if (resp) {
          const respDtoLoc = await this.getFuncLocation(resp);
          this.saveImports(
            path
              .relative(path.normalize(this.config.outFilePath + '/..'), respDtoLoc.path)
              .replace(/\\/g, '/'),
            resp.name,
          );
        }
        apiClientGeneratorDebug('Generating %s: %O', metadata.name, {
          method: metadata.method,
          path: fullPath,
          apiMetadata,
          req,
          resp,
          reqParamType: reqParamTypeMap,
          reqParamSource: reqParamSourceMap,
          hasFileFields,
        });
        apiMethodGen.push(
          this.generateApiMethod({
            name: metadata.name,
            method: metadata.method,
            path: fullPath,
            apiMetadata,
            req,
            resp,
            reqParamType: reqParamTypeMap,
            reqParamSource: reqParamSourceMap,
          }),
        );
        apiReqArgsGen.push(
          this.generateApiRequestArgs({
            name: metadata.name,
            method: metadata.method,
            path: fullPath,
            apiMetadata,
            req,
            resp,
            reqParamType: reqParamTypeMap,
            reqParamSource: reqParamSourceMap,
            hasFileFields,
          }),
        );
      }
    }
    await cleanFuncLoc();
    // generate
    let importGen = '';
    for (const importPath of this.importsMap.keys()) {
      const items = Array.from(this.importsMap.get(importPath));
      let stripPath = importPath;
      if (!stripPath.startsWith('../')) {
        stripPath = './' + stripPath;
      }
      if (stripPath.endsWith('.d.ts')) {
        stripPath = stripPath.substr(0, stripPath.length - '.d.ts'.length);
      } else if (stripPath.endsWith('.ts')) {
        stripPath = stripPath.substr(0, stripPath.length - '.ts'.length);
      } else if (stripPath.endsWith('.js')) {
        stripPath = stripPath.substr(0, stripPath.length - '.js'.length);
      }
      importGen += `import { ${items.join(', ')} } from '${stripPath}';\n`;
    }
    const gen = `/* eslint-disable @typescript-eslint/member-ordering */
/**
 * This file was automatically generated by \`${PKG_NAME}\`.
 * DO NOT MODIFY IT BY HAND.
 */

import { AllowedRequestMethod, IBwcxApiRequestAdaptorArgs, AbstractResponseParser } from '${PKG_NAME}';
import { configure as configureUrlcat } from 'urlcat-fork';
${(this.config.prependImports || []).map((i) => `${i}\n`)}${importGen}
const urlcat = configureUrlcat({ arrayFormat: 'repeat' });

export class ApiClient<T = undefined> {
  private readonly _r: (args: IBwcxApiRequestAdaptorArgs${
    this.config.enableExtraReqOptions ? `<T>` : ''
  }) => Promise<any>;
  private readonly _rp: AbstractResponseParser;

  public constructor(
    requestAdapter: { request: (args: IBwcxApiRequestAdaptorArgs${
      this.config.enableExtraReqOptions ? `<T>` : ''
    }) => Promise<any> },
    responseParser: AbstractResponseParser,
  ) {
    this._r = requestAdapter.request;
    this._rp = responseParser;
  }

${apiMethodGen
  .join('\n\n')
  .split('\n')
  .map((ln) => (ln ? `  ${ln}` : ''))
  .join('\n')}

  private _rArgs = {
${apiReqArgsGen
  .join('\n')
  .split('\n')
  .map((ln) => (ln ? `    ${ln}` : ''))
  .join('\n')}
  }

  private _uf(url: string, extra: { param?: object; query?: object } = {}): string {
    const { param, query } = extra;
    return urlcat(url, {
      ...param,
      ...query,
    });
  }
}
`;
    let existed = '';
    try {
      existed = fs.readFileSync(this.config.outFilePath).toString();
    } catch (e) {}
    if (existed.length === gen.length && existed === gen) {
      return;
    }
    fs.ensureFileSync(this.config.outFilePath);
    fs.writeFileSync(this.config.outFilePath, gen);
    console.log(`[bwcx-api-client] API client generated to ${this.config.outFilePath}`);
  }

  private getReqOrRespStr(value: Newable | null) {
    if (value === null) {
      return 'null';
    }
    return value.name;
  }

  private generateObjAssign(expressList: string[], baseIndent: string, indent: string) {
    if (expressList.length === 0) {
      return '{}';
    }
    return `{
${expressList.map((e) => `${baseIndent}${indent}${e},`).join('\n')}
${baseIndent}}`;
  }

  private generateApiMethod(opts: {
    name: string;
    method: string;
    path: string;
    apiMetadata: ReturnType<typeof getApiMetadata>;
    req: Newable | null;
    resp: Newable | null;
    reqParamType: Record<string, 'param' | 'query' | 'body'>;
    reqParamSource: Record<'param' | 'query' | 'body', string[]>;
  }): string {
    const { apiMetadata } = opts;
    const jsDocs = [];
    if (apiMetadata.description) {
      jsDocs.push(`@description ${apiMetadata.description}`);
    }
    if (apiMetadata.deprecated) {
      jsDocs.push(`@deprecated`);
    }
    if (apiMetadata.version) {
      jsDocs.push(`@version ${apiMetadata.version}`);
    }
    if (apiMetadata.reference) {
      jsDocs.push(`@see ${apiMetadata.reference}`);
    }
    if (apiMetadata.inner) {
      jsDocs.push(`@inner`);
    }
    const jsDocsStr = jsDocs.map((s) => ` * ${s}`).join('\n');

    return `/**
 * ${apiMetadata.summary}
 *${jsDocsStr ? `\n${jsDocsStr}` : ''}
 * @param {${this.getReqOrRespStr(opts.req)}} req The request data (compatible with ReqDTO).${
      this.config.enableExtraReqOptions ? `\n * @param {T} opts Extra request options.` : ''
    }
 * @returns {${this.getReqOrRespStr(opts.resp)}} The response data (RespDTO).
 */
public async ${opts.name}(req${opts.req ? '' : '?'}: ${this.getReqOrRespStr(opts.req)}${
      this.config.enableExtraReqOptions ? `, opts?: T` : ''
    }): Promise<${this.getReqOrRespStr(opts.resp)}> {
  return this._r(this._rArgs.${this.nta(this.aIndex)}(req${
      this.config.enableExtraReqOptions ? `, opts` : ''
    })).then((resp) => this._rp.pat(${this.getReqOrRespStr(opts.resp)}, resp));
}`;
  }

  private generateApiRequestArgs(opts: {
    name: string;
    method: string;
    path: string;
    apiMetadata: ReturnType<typeof getApiMetadata>;
    req: Newable | null;
    resp: Newable | null;
    reqParamType: Record<string, 'param' | 'query' | 'body'>;
    reqParamSource: Record<'param' | 'query' | 'body', string[]>;
    hasFileFields: boolean;
  }): string {
    let formDataGen = '';
    let dataGen = '';
    let headersGen = '';
    if (opts.hasFileFields) {
      formDataGen = `const formData = new FormData();
${opts.reqParamSource.body.map((i) => `  formData.append('${i}', req.${i});`).join('\n')}\n  `;
      dataGen = 'formData';
      headersGen = `\n    headers: {
      'Content-Type': 'multipart/form-data',
    },`;
    } else {
      dataGen = this.generateObjAssign(
        opts.reqParamSource.body.map((i) => `${i}: req.${i}`),
        '    ',
        '  ',
      );
    }
    const reqStr = this.getReqOrRespStr(opts.req);
    const respStr = this.getReqOrRespStr(opts.resp);
    return `${this.nta(this.aIndex)}: (req: ${reqStr}${
      this.config.enableExtraReqOptions ? `, opts?: any` : ''
    }) => {
  ${formDataGen}return {
    method: '${opts.method}' as AllowedRequestMethod,
    url: this._uf('${opts.path}', {
      param: ${this.generateObjAssign(
        opts.reqParamSource.param.map((i) => `${i}: req.${i}`),
        '      ',
        '  ',
      )},
      query: ${this.generateObjAssign(
        opts.reqParamSource.query.map((i) => `${i}: req.${i}`),
        '      ',
        '  ',
      )},
    }),
    data: ${dataGen},${headersGen}
    extraOpts: ${this.config.enableExtraReqOptions ? 'opts' : 'undefined'},
    metadata: {
      name: '${opts.name}',
      method: '${opts.method}',
      path: '${opts.path}',
      req: ${reqStr === 'null' ? 'null as null' : reqStr},
      resp: ${respStr === 'null' ? 'null as null' : respStr},
    },
  };
},`;
  }

  private async getFuncLocation(func: any) {
    return locate(func, { sourceMap: true }).then((res) => {
      if (res && /^\/([A-Z]):/.test(res.path)) {
        // windows
        res.path = res.path.substr(1).replace(/\//g, '\\');
      }
      return res;
    });
  }

  private saveImports(path: string, item: string) {
    if (!this.importsMap.get(path)) {
      this.importsMap.set(path, new Set<string>());
    }
    this.importsMap.get(path).add(item);
  }

  private nta(v: number | string): string {
    const R = 26;
    const res: string[] = [];
    let n = ~~v;
    let cnt = 1;
    let p = R;
    while (n >= p) {
      n -= p;
      cnt++;
      p *= R;
    }
    for (; cnt > 0; cnt--) {
      res.push(String.fromCharCode((n % R) + 97));
      n = Math.trunc(n / R);
    }
    return res.reverse().join('');
  }
}
