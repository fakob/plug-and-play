import PPGraph from "../../classes/GraphClass";
import { PureNode } from "../../classes/NodeClass";
import Socket from "../../classes/SocketClass";
import { NODE_TYPE_COLOR, SOCKET_TYPE } from "../../utils/constants";
import { CustomArgs, TRgba } from "../../utils/interfaces";

export class MacroIn extends PureNode {
    constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
        super(name, graph, {
            ...customArgs,
            color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
        });
    }

    protected getDefaultIO(): Socket[] {
        return [
        ];
    }
    protected async onExecute(
        inputObject: unknown,
        outputObject: Record<string, unknown>
    ): Promise<void> {
    }
}