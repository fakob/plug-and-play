import { CustomFunction } from "./dataFunctions";

export class UnitConversion extends CustomFunction {

    public getName(): string {
        return 'Unit Conversion';
    }

    public getDescription(): string {
        return 'Converts all found units to common base';
    }

    protected getDefaultFunction(): string {
        return '(ArrayIn) => {\n\
        const toReturn = [];\n\
        for (let i = 0; i < ArrayIn.length; i++){\n\
            toReturn.push(await 1);\n\
        }\n\
        return toReturn;\n\
    }';
    }
}