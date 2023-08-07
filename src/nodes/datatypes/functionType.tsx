import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

// its a function that will draw onto a container
export class FunctionType extends AbstractType {
  getName(): string {
    return 'Function';
  }

  getComment(commentData: any): string {
    return commentData ? 'Graphics' : 'null';
  }

  getColor(): TRgba {
    return new TRgba(239, 239, 138);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['CodeEditor'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }
}
