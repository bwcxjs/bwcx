import path from 'path';

export class RouteGeneratorUtils {
  public static getRelativeFileModulePath(from: string, to: string) {
    const res = path.relative(path.dirname(from), to);
    if (!res.startsWith('.')) {
      return `./${res}`;
    }
    return res;
  }
}
