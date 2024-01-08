import path from 'path';
import fs from 'fs-extra';
import {
  Identifier,
  Node,
  LeftHandSideExpression,
  Decorator,
  ClassDeclaration,
  SourceFile,
  ObjectLiteralExpression,
  CallExpression,
} from 'ts-morph';
import debug from 'debug';
import { AnalysedRoute } from '../interface';
import { AnalyserWarning } from '../exceptions';

const t = debug('t');
const parseDbg = debug('bwcx:client:vue:route:gen:analyse:parse');
const PKG_NAME = 'bwcx-client-vue';

export default abstract class AbstractSourceAnalyser {
  public constructor(protected readonly filePath: string) {}

  public getVueSourceAndLang() {
    const ALLOWED_EXTS = ['.js', '.ts', '.jsx', '.tsx', '.vue'];
    const ext = path.extname(this.filePath);
    if (!ALLOWED_EXTS.includes(ext)) {
      throw new AnalyserWarning(`${this.filePath} is not a recognized file`);
    }
    const source = fs.readFileSync(this.filePath).toString();
    if (ext === '.vue') {
      const [, langSource, vueScript] =
        /<script\b([^>]*)>([\s\S]*?)<\/script>/gm.exec(source) || [];
      const lang = /lang=[\"'](.*)[\"'].*/gm.exec(langSource || '')?.[1];
      return {
        lang: lang || 'js',
        source: (vueScript || '').trim(),
      };
    }
    return {
      lang: ext.substr(1),
      source: source || '',
    };
  }

  protected isBwcxClientPackageImport(expr: LeftHandSideExpression | Identifier, name: string) {
    if (Node.isIdentifier(expr)) {
      t('isIdentifier');
      const def = expr.getDefinitions()[0];
      t('getDefinitions');
      if (def && def.getContainerName().includes(PKG_NAME) && def.getName() === name) {
        return true;
      }
      // const imp = getIdentifierNode(expr);
      // t('isBwcxClientPackageImport > getDefinitionNodes');
      // if (Node.isImportSpecifier(imp)) {
      //   t('isBwcxClientPackageImport > isImportSpecifier');
      //   if (imp.getName() !== name) {
      //     t('isBwcxClientPackageImport > getName');
      //     return false;
      //   }
      //   const module = imp.getImportDeclaration().getModuleSpecifierValue();
      //   t(
      //     'isBwcxClientPackageImport > getImportDeclaration().getModuleSpecifierValue()',
      //   );
      //   return isBwcxClientPackage(module);
      // }
    }
    return false;
  }

  protected isBwcxClientPackageDecoratorFactory(decorator: Decorator, name: string) {
    const decoratorExpr = decorator.getCallExpression()?.getExpression();
    t('isBwcxClientPackageDecoratorFactory > getCallExpression()?.getExpression()');
    if (this.isBwcxClientPackageImport(decoratorExpr, name)) {
      return true;
    }
    return false;
  }

  protected getIdentifierNode(identifier: Identifier) {
    return identifier.getDefinitionNodes()[0];
  }

  protected parseArgsFromClassDeclaration(classDef: ClassDeclaration) {
    t('getName');
    const decorators = classDef.getDecorators();
    t('getDecorators');
    const viewDecorator = decorators.find((d) => this.isBwcxClientPackageDecoratorFactory(d, 'View'));
    t('isBwcxClientPackageDecoratorFactory');
    const childOfDecorator = decorators.find((d) =>
      this.isBwcxClientPackageDecoratorFactory(d, 'ChildOf'),
    );
    t('isBwcxClientPackageDecoratorFactory');
    const priorityDecorator = decorators.find((d) =>
      this.isBwcxClientPackageDecoratorFactory(d, 'Priority'),
    );
    const renderMethodDecorator = decorators.find((d) =>
      this.isBwcxClientPackageDecoratorFactory(d, 'RenderMethod'),
    );
    t('isBwcxClientPackageDecoratorFactory');
    const [pathArg, routePropsArg, otherOptionsArg] = viewDecorator?.getArguments() || [];
    if (!pathArg) {
      return null;
    }
    const [childOfArg] = childOfDecorator?.getArguments() || [];
    const [priorityArg] = priorityDecorator?.getArguments() || [];
    const [renderMethodArg] = renderMethodDecorator?.getArguments() || [];
    parseDbg('parsed args from class declaration');
    return {
      name: classDef.getName(),
      path: pathArg,
      routeProps: routePropsArg,
      otherOptions: otherOptionsArg,
      childOf: childOfArg,
      priority: priorityArg,
      renderMethod: renderMethodArg,
    };
  }

  protected parseArgsFromCallExpression(ce: CallExpression, location: string) {
    const args = ce.getArguments() || [];
    t('parseArgsFromCallExpression.getArguments');
    const [componentArg, pathArg, routePropsArg, otherOptionsArg, extraMetaArg] = args;
    if (!componentArg || !pathArg) {
      return null;
    }
    let componentObjectExpression: ObjectLiteralExpression;
    if (Node.isIdentifier(componentArg)) {
      const componentDef = componentArg.getDefinitionNodes()[0];
      t('parseArgsFromCallExpression.getDefinitionNodes');
      if (Node.isVariableDeclaration(componentDef)) {
        const initializer = componentDef.getInitializer();
        t('parseArgsFromCallExpression.getInitializer');
        if (Node.isObjectLiteralExpression(initializer)) {
          // object style component
          componentObjectExpression = initializer;
        } else if (Node.isCallExpression(initializer)) {
          // possible Vue.extend
          const firstArg = initializer.getArguments()[0];
          t('parseArgsFromCallExpression.getArguments');
          if (Node.isObjectLiteralExpression(firstArg)) {
            componentObjectExpression = firstArg;
          }
        }
      }
    }
    let componentName: string;
    if (componentObjectExpression) {
      const nameProperty = componentObjectExpression.getProperty('name');
      t('parseArgsFromCallExpression.getProperty');
      if (Node.isPropertyAssignment(nameProperty)) {
        // @ts-ignore
        componentName = nameProperty.getInitializer()?.getLiteralText();
        t('parseArgsFromCallExpression.getInitializer()?.getLiteralText()');
      }
    }
    if (!componentName) {
      // try to get component name by file name
      componentName = path.basename(location).split('.')[0];
    }
    let childOfArg;
    let priorityArg;
    let renderMethodArg;
    if (Node.isObjectLiteralExpression(extraMetaArg)) {
      // @ts-ignore
      childOfArg = extraMetaArg.getProperty('childOf')?.getInitializer();
      t('parseArgsFromCallExpression.getProperty()?.getInitializer()');
      // @ts-ignore
      priorityArg = extraMetaArg.getProperty('priority')?.getInitializer();
      t('parseArgsFromCallExpression.getProperty()?.getInitializer()');
      // @ts-ignore
      renderMethodArg = extraMetaArg.getProperty('renderMethod')?.getInitializer();
      t('parseArgsFromCallExpression.getProperty()?.getInitializer()');
    }
    parseDbg('parsed args from call expression');
    return {
      component: componentArg,
      name: componentName,
      path: pathArg,
      routeProps: routePropsArg,
      otherOptions: otherOptionsArg,
      childOf: childOfArg,
      priority: priorityArg,
      renderMethod: renderMethodArg,
    };
  }

  protected parseSource(sourceFile: SourceFile) {
    parseDbg('parsing source...');
    let args: {
      name: string;
      path: Node;
      routeProps: Node;
      otherOptions?: Node;
      childOf?: Node;
      priority?: Node;
      renderMethod?: Node;
    };
    let isClassComponent = false;
    let defaultExport: Node;
    let component: Node;
    // const exportAssignments = sourceFile.getExportAssignments();
    // t('getExportAssignments');
    t('start parseSource');
    const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
    t('getDefaultExportSymbol');
    if (defaultExportSymbol) {
      const declaration = defaultExportSymbol.getDeclarations()[0];
      t('getDeclarations');
      if (Node.isExportAssignment(declaration)) {
        t('isExportAssignment');
        const expr = declaration.getExpression();
        t('getExpression');
        if (Node.isIdentifier(expr)) {
          t('isIdentifier');
          const defNode = this.getIdentifierNode(expr);
          t('getDefinitionNodes');
          if (Node.isClassDeclaration(defNode)) {
            t('isClassDeclaration');
            parseDbg('found class component');
            defaultExport = component = defNode;
            isClassComponent = true;
            args = this.parseArgsFromClassDeclaration(defNode);
          }
        } else if (Node.isCallExpression(expr)) {
          // 常规组件
          const funcExpr = expr.getExpression();
          if (this.isBwcxClientPackageImport(funcExpr, 'routeView')) {
            parseDbg('found normal component using routeView()');
            defaultExport = sourceFile.getExportAssignments()[0];
            t('getExportAssignments');
            const res = this.parseArgsFromCallExpression(expr, this.filePath);
            component = res.component;
            delete res.component;
            args = res;
          }
        }
      } else if (Node.isClassDeclaration(declaration)) {
        parseDbg('found class component');
        defaultExport = component = declaration;
        isClassComponent = true;
        args = this.parseArgsFromClassDeclaration(declaration);
      }
    }
    if (!defaultExport || !component || !args) {
      throw new AnalyserWarning('Skipped due to cannot find default export or its route args');
    }
    return {
      args,
      defaultExport,
      component,
    };
  }

  public abstract analyseSource(): [
    /** client router appended text */ string,
    /** common router appended text */ string,
    AnalysedRoute,
  ];
}
