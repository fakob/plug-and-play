import FlowLogic from '../classes/FlowLogic';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';

// pretty cool function isnt it
// assumes no circular dependencies
function findNodeDependencyDepth(node: PPNode): number {
  const upLinkSockets = node
    .getAllInputSockets()
    .filter((socket) => socket.hasLink());
  if (!upLinkSockets.length) {
    return 0;
  } else {
    return (
      upLinkSockets
        .map((socket) =>
          findNodeDependencyDepth(socket.links[0].getSource().getNode()),
        )
        .reduce((a, b) => Math.max(a, b), 0) + 1
    );
  }
}

function getNodeDetails(node: PPNode) {
  return JSON.stringify({
    Name: node.getName(),
    ID: node.id,
    /*InputNodeNames: node
      .getAllInputSockets()
      .filter((socket) => socket.hasLink())
      .map((socket) => socket.links[0].getSource().getNode().getName()),*/
  });
}

function extractChainExplanation(nodes: PPNode[]) {
  const dependencyDepths = nodes.map(findNodeDependencyDepth);
  const maxLevel = dependencyDepths.reduce((a, b) => Math.max(a, b), 0);
  let dependencyPyramid = '';
  for (let i = 0; i <= maxLevel; i++) {
    dependencyPyramid += 'Level ' + i + ': ';
    const onThisLevel = nodes
      .filter((node, index) => dependencyDepths[index] == i)
      .map(getNodeDetails);
    dependencyPyramid += onThisLevel.join(',');
    dependencyPyramid += '\n';
  }
  console.log('Dependency Pyramid: \n' + dependencyPyramid);
  return nodes.map((node) => {
    return JSON.stringify({
      Name: node.getName(),
      Depth: findNodeDependencyDepth(node),
      asciiArt: dependencyPyramid,
    });
  });
}

export function extractExplanation(graph: PPGraph): string {
  const numNodes = Object.values(graph.nodes).length;
  const seedNodes = Object.values(graph.nodes).filter(
    (node) => !node.getHasDependencies(),
  );

  const found = new Set();
  const uniqueChains: PPNode[][] = [];
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
    Chains: uniqueChains.map(extractChainExplanation),
  };

  console.log(JSON.stringify(toReturn));
  //console.log(result);
  return JSON.stringify(toReturn);
}
