/*import FlowLogic from '../classes/FlowLogic';
import PPGraph from '../classes/GraphClass';

export function extractExplanation(graph: PPGraph): string {
  const numNodes = Object.values(graph.nodes).length;
  const seedNodes = PPGraph.getSeedNodes(Object.values(graph.nodes), false);

  const found = new Set();
  const uniqueChains = [];
  seedNodes.forEach((seedNode) => {
    if (!found.has(seedNode.id)) {
      const inThisChain = FlowLogic.getAllUpDownstreamNodes(
        seedNode,
        true,
        true,
        true,
      );
      uniqueChains.push(inThisChain);
      inThisChain.forEach((node) => found.add(node.id));
    }
  });

  const toReturn = {
    'Number of nodes': numNodes,
    'Seed nodes': {
      Number: seedNodes.length,
      Names: seedNodes.map((node) => node.getName()).join(','),
    },
    'Unique execution chains': +uniqueChains.length,
  };
  console.log(JSON.stringify(toReturn));

  const result =
    'Graph has ' +
    numNodes +
    ' nodes, and ' +
    seedNodes.length +
    ' seed nodes (nodes without any other node as input).\n' +
    'Separate execution chains ' +
    uniqueChains.length;
  //console.log(result);
  return JSON.stringify(toReturn);
}

*/
