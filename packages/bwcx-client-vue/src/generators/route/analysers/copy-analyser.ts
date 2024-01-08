import path from 'path';
import {
  Node,
  Project,
  ClassDeclaration,
  SourceFile,
  CodeBlockWriter,
  VariableDeclarationKind,
} from 'ts-morph';
import debug from 'debug';
import AbstractSourceAnalyser from './analyser.abstract';
import { AnalysedRoute } from '../interface';
import { AnalyserWarning } from '../exceptions';

const analyseDbg = debug('bwcx:client:vue:route:gen:analyse');
const manipulateDbg = debug('bwcx:client:vue:route:gen:analyse:manipulate');

export default class CopySourceAnalyser extends AbstractSourceAnalyser {
  public constructor(
    filePath: string,
    private readonly project: Project,
    private readonly outClientRouterPath: string,
    private readonly outCommonRouterPath: string,
  ) {
    super(filePath);
  }

  private removeAllUnused(sourceFile: SourceFile) {
    let lastWidth: number;
    do {
      lastWidth = sourceFile.getFullWidth();
      sourceFile.fixUnusedIdentifiers();
    } while (lastWidth !== sourceFile.getFullWidth());
    return sourceFile;
  }

  private manipulateAndGetAnalysedPart(
    sourceFile: SourceFile,
    args: {
      name: string;
      path: Node;
      routeProps?: Node;
      otherOptions?: Node;
      childOf?: Node;
      priority?: Node;
      renderMethod?: Node;
    },
    defaultExport: Node,
  ): [
    string,
    string,
    {
      name: string;
      path: string;
      location: string;
      routeProps: string;
      otherOptions: string;
      childOf: string;
      priority: string;
      renderMethod: string;
    },
  ] {
    manipulateDbg('manipulating source...');
    // prepare extra info
    const labeldPropertyValue = {
      path: args.path.getText() || 'undefined',
      routeProps: args.routeProps?.getText() || 'undefined',
      otherOptions: args.otherOptions?.getText() || 'undefined',
      childOf: args.childOf?.getText() || 'undefined',
      priority: args.priority?.getText() || 'undefined',
      renderMethod: args.renderMethod?.getText() || 'undefined',
    };
    let routePropsClassDeclaration: ClassDeclaration;
    if (Node.isClassDeclaration(args.routeProps)) {
      routePropsClassDeclaration = args.routeProps;
    } else if (Node.isIdentifier(args.routeProps)) {
      const defNode = args.routeProps.getDefinitionNodes()[0];
      if (Node.isClassDeclaration(defNode)) {
        routePropsClassDeclaration = defNode;
      }
    }
    if (args.routeProps && !routePropsClassDeclaration) {
      throw new AnalyserWarning('Skipped due to cannot find route props class');
    }
    const routePropsIdentifierText = routePropsClassDeclaration?.getName();
    manipulateDbg('found route props class declaration: %O', routePropsIdentifierText);
    // remove all exports prefix
    const exportedDeclarations = sourceFile.getExportedDeclarations();
    manipulateDbg('got exported declarations');
    for (const k of exportedDeclarations.keys()) {
      if (k === 'default') {
        const defaultTarget = exportedDeclarations.get(k)[0];
        if (!Node.isCallExpression(defaultTarget)) {
          // @ts-ignore
          defaultTarget?.setIsDefaultExport?.(false);
        }
        continue;
      }
      const values = exportedDeclarations.get(k) as Node[];
      for (const v of values) {
        if (v === routePropsClassDeclaration) {
          continue;
        }
        if (Node.isVariableDeclaration(v)) {
          v.getVariableStatement().setIsExported(false);
        } else {
          // @ts-ignore
          v?.setIsExported(false);
        }
      }
    }
    manipulateDbg('let all exported declarations as not-exported except route props');
    const exportDeclarations = sourceFile.getExportDeclarations();
    manipulateDbg('got export declarations');
    exportDeclarations.forEach((ed) => {
      ed.remove();
    });
    manipulateDbg('removed all export declarations');
    // remove default export
    // @ts-ignore
    defaultExport?.remove();
    manipulateDbg('removed default export');
    // write ref keeper
    const refKeeperName = '__bwcx_client_refKeeper';
    const writer = new CodeBlockWriter({
      indentNumberOfSpaces: 2,
    });
    writer.block(() => {
      writer.writeLine(`path: ${labeldPropertyValue.path},`);
      writer.writeLine(`routeProps: ${labeldPropertyValue.routeProps},`);
      writer.writeLine(`childOf: ${labeldPropertyValue.childOf},`);
      writer.writeLine(`priority: ${labeldPropertyValue.priority},`);
      writer.writeLine(`renderMethod: ${labeldPropertyValue.renderMethod},`);
      writer.writeLine(`otherOptions: ${labeldPropertyValue.otherOptions},`);
    });
    sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: refKeeperName,
          initializer: writer.toString(),
        },
      ],
      isExported: true,
    });
    manipulateDbg('wrote ref keeper');
    // remove unused
    this.removeAllUnused(sourceFile);
    manipulateDbg('removed all unused');
    // remove ref keeper
    sourceFile.getVariableDeclaration(refKeeperName).remove();
    manipulateDbg('removed ref keeper');
    let routePropsClassName: string = 'undefined';
    if (routePropsIdentifierText) {
      routePropsClassDeclaration = sourceFile.getClass(routePropsIdentifierText);
      // // mark routeprops as not exported
      // routePropsClassDeclaration.setIsExported(false);
      // t('write:setIsExported');
      // rename routeProps class
      routePropsClassName = `BwcxClientARP${args.name}Dot${routePropsIdentifierText}`;
      routePropsClassDeclaration.rename(routePropsClassName);
      manipulateDbg('renamed route props as %O', routePropsClassName);
    }
    const sourceFileForCommon = this.project.createSourceFile(
      `${sourceFile.getFilePath()}.c.${sourceFile.getExtension()}`,
      sourceFile.getText(),
    );
    sourceFile.moveToDirectory(path.dirname(this.outClientRouterPath));
    sourceFileForCommon.organizeImports();
    sourceFileForCommon.moveToDirectory(path.dirname(this.outCommonRouterPath));
    manipulateDbg('modified reference path to output router path');
    // collect analysed route
    const analysedRoute = {
      name: args.name,
      path: labeldPropertyValue.path,
      location: this.filePath,
      routeProps: routePropsClassName,
      otherOptions: labeldPropertyValue.otherOptions,
      childOf: labeldPropertyValue.childOf,
      priority: labeldPropertyValue.priority,
      renderMethod: labeldPropertyValue.renderMethod,
    };
    return [sourceFile.getText(), sourceFileForCommon.getText(), analysedRoute];
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
    const [
      clientAppendedText,
      commonAppendedText,
      analysedRoute,
    ] = this.manipulateAndGetAnalysedPart(sourceFile, args, defaultExport);
    analyseDbg('manipulated and analysed: %O', analysedRoute);
    return [clientAppendedText, commonAppendedText, analysedRoute];
  }
}
