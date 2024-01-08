import path from 'path';
import { Node, Project, SyntaxKind } from 'ts-morph';
import debug from 'debug';
import { createMatchPath } from 'tsconfig-paths';
import AbstractSourceAnalyser from './analyser.abstract';
import { AnalysedRoute } from '../interface';
import { RouteGeneratorUtils } from '../utils';
import { AnalyserWarning } from '../exceptions';

const analyseDbg = debug('bwcx:client:vue:route:gen:analyse');

export default class ReferenceSourceAnalyser extends AbstractSourceAnalyser {
  public constructor(
    filePath: string,
    private readonly project: Project,
    private readonly outClientRouterPath: string,
    private readonly outCommonRouterPath: string,
  ) {
    super(filePath);
  }

  public analyseSource(): [string, string, AnalysedRoute] {
    const { lang, source } = this.getVueSourceAndLang();
    analyseDbg('vue source info: { lang: %O, length: %O }', lang, (source || '').length);
    const SUPPORTED_LANG = ['ts', 'tsx'];
    if (!SUPPORTED_LANG.includes(lang)) {
      throw new AnalyserWarning(
        `Skipped due to language "${lang}" is not supported. Only [${SUPPORTED_LANG}] are supported`,
      );
    }
    const sourceFile = this.project.createSourceFile(
      `${this.filePath}.a.temp-${Date.now()}.${lang}`,
      source,
    );
    const { args, defaultExport } = this.parseSource(sourceFile);
    analyseDbg('parsed component: %O', args.name);
    const importDeclarations = sourceFile.getImportDeclarations();
    const importClauseTexts = importDeclarations.map((i) => i.getImportClause()?.getText?.());
    const toCheckIdentifiers = [args.routeProps, args.otherOptions, args.renderMethod]
      .filter((f) => f)
      .map((item) =>
        Node.isIdentifier(item) ? [item] : item.getDescendantsOfKind(SyntaxKind.Identifier),
      )
      .reduce((acc, cur) => [...acc, ...cur], []);
    const identifierNames = toCheckIdentifiers.map((i) => i.getText());
    // simple and light check
    const reservedImportIndexSet = new Set<number>();
    identifierNames.forEach((name) => {
      importClauseTexts.forEach((ic, index) => {
        if (!ic) {
          return;
        }
        if (reservedImportIndexSet.has(index)) {
          return;
        } else if (ic.search(name) >= 0) {
          reservedImportIndexSet.add(index);
        }
      });
    });
    const reservedImportDeclarations = importDeclarations.filter((imp, index) =>
      reservedImportIndexSet.has(index),
    );
    const labeldPropertyValue = {
      path: args.path.getText() || 'undefined',
      routeProps: args.routeProps?.getText() || 'undefined',
      otherOptions: args.otherOptions?.getText() || 'undefined',
      childOf: args.childOf?.getText() || 'undefined',
      priority: args.priority?.getText() || 'undefined',
      renderMethod: args.renderMethod?.getText() || 'undefined',
    };
    let routePropsIdentifierText: string;
    if (Node.isClassDeclaration(args.routeProps)) {
      routePropsIdentifierText = args.routeProps.getName();
    } else if (
      Node.isIdentifier(args.routeProps) ||
      Node.isPropertyAccessExpression(args.routeProps)
    ) {
      routePropsIdentifierText = args.routeProps.getText();
    }
    if (args.routeProps && !routePropsIdentifierText) {
      throw new AnalyserWarning('Skipped due to cannot find route props class');
    }
    const analysedRoute = {
      name: args.name,
      path: labeldPropertyValue.path,
      location: this.filePath,
      routeProps: routePropsIdentifierText,
      otherOptions: labeldPropertyValue.otherOptions,
      childOf: labeldPropertyValue.childOf,
      priority: labeldPropertyValue.priority,
      renderMethod: labeldPropertyValue.renderMethod,
    };
    // rewrite module path
    const compilerOptions = this.project.getCompilerOptions();
    const matcher = createMatchPath(compilerOptions.baseUrl, compilerOptions.paths);
    let routePropsCommonImport = '';
    const sourceText = reservedImportDeclarations
      .map((imp) => {
        const module = imp.getModuleSpecifierValue();
        let moduleAbsPath: string;
        if (imp.isModuleSpecifierRelative()) {
          moduleAbsPath = path.resolve(path.dirname(this.filePath), module);
        } else {
          moduleAbsPath = matcher(module, undefined, undefined, [
            '.js',
            '.jsx',
            '.json',
            '.node',
            '.ts',
            '.tsx',
          ]);
        }
        const text = imp.getText();
        let isRoutePropsImport = false;
        if (moduleAbsPath) {
          const importClause = imp.getImportClause()?.getText() || '';
          const importClauseLabels = importClause
            .replace(/,/g, '')
            .split(' ')
            .filter((f) => f);
          if (importClauseLabels.includes(routePropsIdentifierText.split('.')[0])) {
            isRoutePropsImport = true;
            routePropsCommonImport = text.replace(
              module,
              RouteGeneratorUtils.getRelativeFileModulePath(
                this.outCommonRouterPath,
                moduleAbsPath,
              ),
            );
          }
          return text.replace(
            module,
            RouteGeneratorUtils.getRelativeFileModulePath(this.outClientRouterPath, moduleAbsPath),
          );
        }
        return text;
      })
      .join('\n');
    return [sourceText, routePropsCommonImport, analysedRoute];
  }
}
