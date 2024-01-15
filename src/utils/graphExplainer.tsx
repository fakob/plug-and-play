import FlowLogic from '../classes/FlowLogic';
import PPGraph from '../classes/GraphClass';
import PPLink from '../classes/LinkClass';
import PPNode from '../classes/NodeClass';
import { getCircularReplacer } from './utils';

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

function getNodeExplanations(node: PPNode) {}

function getConnectionExplanation(link: PPLink) {
  const stringified = link.getSource().getStringifiedData();
  let truncated = stringified;
  if (stringified.length > 60) {
    truncated = stringified.substring(0, 60) + '...';
  }
  return {
    To: link.getTarget().getNode().id,
    From: link.getSource().getNode().id,
    Data: truncated,
  };
}

function extractDependencyPyramid(nodes: PPNode[]) {
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
  return dependencyPyramid;
}

export function extractExplanation(graph: PPGraph): string {
  const nodes = Object.values(graph.nodes);
  const numNodes = nodes.length;
  const seedNodes = nodes.filter((node) => !node.getHasDependencies());

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
  const links = nodes
    .map((node) =>
      node
        .getAllInputSockets()
        .filter((socket) => socket.hasLink())
        .map((socket) => socket.links[0]),
    )
    .flat();

  const toReturn = {
    'Number of nodes': numNodes,
    'Seed nodes': {
      Number: seedNodes.length,
      Names: seedNodes.map((node) => node.getName()).join(','),
    },
    'Dependency Pyramids': uniqueChains.map(extractDependencyPyramid),
    Connections: links.map(getConnectionExplanation),
  };

  console.log(JSON.stringify(toReturn));
  //console.log(result);
  return JSON.stringify(toReturn);
}
