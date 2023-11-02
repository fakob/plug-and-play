import { TRgba } from '../utils/interfaces';

abstract class PNPError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.getName();

    // This is necessary for the instanceof check to work correctly in transpiled ES5/ES6 code.
    Object.setPrototypeOf(this, PNPError.prototype);
  }
  public abstract getName(): string;
  public abstract getDescription(): string;
  public abstract getColor(): TRgba;
}

export class FatalError extends PNPError {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, FatalError.prototype);
  }
  public getName(): string {
    return 'Fatal Error';
  }
  public getDescription(): string {
    return 'Unrecoverable error, PNP needs to close';
  }

  public getColor(): TRgba {
    return TRgba.black();
  }
}

export class NodeExecutionError extends PNPError {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, NodeExecutionError.prototype);
  }

  public getName(): string {
    return 'Execution Error';
  }
  public getDescription(): string {
    return 'Node failed to execute ';
  }

  public getColor(): TRgba {
    return TRgba.black(); // Jakob please decide on color (Red??)
  }
}
export class NodeExecutionWarning extends PNPError {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, NodeExecutionWarning.prototype);
  }

  public getName(): string {
    return 'Execution Warning';
  }
  public getDescription(): string {
    return 'Node executed with warnings';
  }

  public getColor(): TRgba {
    return TRgba.black(); // Jakob please decide on color (Orange??)
  }
}

// is this relevant???
/*export class GraphConfigurationError extends PNPError {
  public getName(): string {
    return 'Graph Error';
  }
  public getDescription(): string {
    return 'Graph: ' + this.reason;
  }

  public getColor(): TRgba {
    return TRgba.black(); // Jakob please decide on color (Purple??)
  }
}*/
