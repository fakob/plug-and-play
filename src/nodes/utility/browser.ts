import { CustomFunction } from '../data/dataFunctions';

export class OpenURL extends CustomFunction {
  protected getDefaultFunction(): string {
    return `(url) => {
  const openNewTab = (thisUrl) => {
    if (typeof thisUrl === 'string') {
      window.open(thisUrl, '_blank')?.focus();
    }
  };
  openNewTab(url);
}`;
  }

  public getName(): string {
    return 'Open URL';
  }
  public getDescription(): string {
    return 'Opens a URL in a new tab';
  }
}
