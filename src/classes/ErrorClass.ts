import { TRgba } from '../utils/interfaces';

export abstract class PNPStatus extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.getName();

    // This is necessary for the instanceof check to work correctly in transpiled ES5/ES6 code.
    Object.setPrototypeOf(this, PNPStatus.prototype);
  }
  public abstract getName(): string;
  public abstract getDescription(): string;
  public abstract getColor(): TRgba;
  public abstract isError(): boolean;
}

export abstract class PNPError extends PNPStatus {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, PNPError.prototype);
  }
  public isError(): boolean {
    return true;
  }
  public getName(): string {
    return 'Error';
  }
  public getDescription(): string {
    return 'Nondescript Error';
  }

  public getColor(): TRgba {
    return TRgba.black();
  }
}

export class PNPSuccess extends PNPStatus {
  public isError(): boolean {
    return false;
  }
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, PNPSuccess.prototype);
  }
  public getName(): string {
    return 'Success';
  }
  public getDescription(): string {
    return 'Success';
  }

  public getColor(): TRgba {
    return TRgba.white();
  }
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
    return 'Unrecoverable error, PNP cannot continue';
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
    return 'Node Execution Error';
  }
  public getDescription(): string {
    return 'Node failed to execute ';
  }

  public getColor(): TRgba {
    return TRgba.fromString('#CCFFFF'); // Jakob please decide on color (Red??)
  }
}

export class NodeConfigurationError extends PNPError {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, NodeConfigurationError.prototype);
  }

  public getName(): string {
    return 'Node Configuration Error';
  }
  public getDescription(): string {
    return 'Node configuration failed';
  }

  public getColor(): TRgba {
    return TRgba.fromString('#CC66FF'); // Jakob please decide on color (??)
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
