import PPNode from './NodeClass';
import Socket from './SocketClass';

// only static functions to manage flow behaviour
export default class FlowLogic {
  static aggregateDependents(
    node,
    dependents: { [key: string]: PPNode }
  ): {
    [key: string]: Set<string>;
  } {
    // don't add from same node several times
    if (dependents[node.id] !== undefined) {
      return {};
    }

    //console.log('aggregating');
    dependents[node.id] = node;

    if (!node.propagateExecutionPast()) {
      return {};
    }

    const currDependents: { [key: string]: PPNode } =
      node.getDirectDependents();
    // populate dependents

    const numDepending: { [key: string]: Set<string> } = {};
    Object.keys(currDependents).forEach((dependentKey) => {
      numDepending[dependentKey] = new Set();
      numDepending[dependentKey].add(node.id);
    });

    // accumulate results from children and merge with mine
    Object.values(currDependents).forEach((dependent) => {
      const result = FlowLogic.aggregateDependents(dependent, dependents);
      FlowLogic.combineNumDependings(numDepending, result);
    });

    return numDepending;
  }

  static combineNumDependings(
    numDepending1: { [key: string]: Set<string> },
    numDepending2: { [key: string]: Set<string> }
  ): void {
    Object.keys(numDepending2).forEach((childDependent) => {
      if (numDepending1[childDependent] === undefined) {
        numDepending1[childDependent] = numDepending2[childDependent];
      } else {
        numDepending2[childDependent].forEach((childDependentKey) => {
          numDepending1[childDependent].add(childDependentKey);
        });
      }
    });
  }

  static goThroughSockets(
    currDependents: { [key: string]: PPNode },
    socketArray: Socket[],
    upstream = false
  ): void {
    socketArray.forEach((socket) => {
      Object.values(socket.getLinkedNodes(upstream)).forEach((dependent) => {
        if (dependent !== undefined) {
          currDependents[dependent.id] = dependent;
        }
      });
    });
  }

  static getLinkedNodes(
    node: PPNode,
    includeUpstream = false,
    includeDownstream = true
  ): { [key: string]: PPNode } {
    const currDependents: { [key: string]: PPNode } = {};

    if (includeUpstream) {
      this.goThroughSockets(currDependents, node.getAllInputSockets(), true);
    }
    if (includeDownstream) {
      this.goThroughSockets(currDependents, node.outputSocketArray);
    }
    return currDependents;
  }

  static async executeOptimizedChainBatch(
    foundational: PPNode[]
  ): Promise<void> {
    const dependents: { [key: string]: PPNode } = {};
    const numDepending: { [key: string]: Set<string> } = {};
    foundational.forEach((node: PPNode) => {
      Object.keys(node.getDirectDependents()).forEach((dependentKey) => {
        numDepending[dependentKey] = new Set();
        numDepending[dependentKey].add(node.id);
      });
      FlowLogic.combineNumDependings(
        numDepending,
        FlowLogic.aggregateDependents(node, dependents)
      );
    });
    // now that we have the complete chain, execute them in order that makes sure all dependents are waiting on their parents, there should always be a node with no more lingering dependents (unless there is an infinite loop)
    let currentExecuting: PPNode = foundational.shift();

    while (currentExecuting) {
      await currentExecuting.execute();
      //console.log('executing');
      // uncomment if you want to see the execution in more detail by slowing it down (to make sure order is correct)
      //await new Promise((resolve) => setTimeout(resolve, 500));
      Object.keys(currentExecuting.getDirectDependents()).forEach(
        (dependentKey) => {
          if (numDepending[dependentKey]) {
            numDepending[dependentKey].delete(currentExecuting.id);
            // if this child has no other nodes it is waiting on, and one of its parents did change its output, add it to the queue of nodes to be executed
            if (numDepending[dependentKey].size == 0) {
              foundational.push(dependents[dependentKey]);
            }
          }
        }
      );
      currentExecuting = foundational.shift();
    }
    return;
  }

  static getAllUpDownstreamNodes(
    node: PPNode,
    includeUpstream: boolean,
    includeDownstream: boolean,
    wholeBranch: boolean // includes the whole up/downstream branch
  ): PPNode[] {
    const getDirectDependentsAndAccumulateThem = (
      dependents: {
        [key: string]: PPNode;
      },
      includeUpstream: boolean,
      includeDownstream: boolean,
      wholeBranch: boolean
    ): void => {
      Object.values(dependents).forEach((node) => {
        const newDependents: { [key: string]: PPNode } =
          FlowLogic.getLinkedNodes(
            node,
            wholeBranch || includeUpstream,
            wholeBranch || includeDownstream
          );

        combinedDependents[node.id] = node;

        const filtered = Object.keys(newDependents)
          .filter((key) => combinedDependents[key] === undefined)
          .reduce((obj, key) => {
            obj[key] = newDependents[key];
            return obj;
          }, {});

        getDirectDependentsAndAccumulateThem(
          filtered,
          includeUpstream,
          includeDownstream,
          wholeBranch
        );
      });
    };

    const combinedDependents: { [key: string]: PPNode } = {};
    combinedDependents[node.id] = node;

    if (includeUpstream && includeDownstream) {
      getDirectDependentsAndAccumulateThem(
        combinedDependents,
        includeUpstream,
        includeDownstream,
        wholeBranch
      );
    } else {
      getDirectDependentsAndAccumulateThem(
        FlowLogic.getLinkedNodes(node, includeUpstream, includeDownstream),
        includeUpstream,
        includeDownstream,
        wholeBranch
      );
    }
    return Object.values(combinedDependents);
  }
}
