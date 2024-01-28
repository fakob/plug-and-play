import { doWithTestController } from './helpers';

// TODO add all nodes
describe('checkNodesForErrors', () => {
  let numGoodNodes = 0;
  it('add one of each node', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    let allNodeTypes = [];
    const nodesWithKnownErrors: string[] = [
      'DRAW_Shape',
    ]; // TODO FIX THESE !!!!
    let goodNodes = [];

    // Fetch all node types and process them within the same test
    doWithTestController((testController) => {
      allNodeTypes = testController.getAllDefinedNodeTypes();
      cy.log('all node types: ' + JSON.stringify(allNodeTypes));
      numGoodNodes = goodNodes.length;
    });
    cy.wait(100);

    doWithTestController((testController) => {
      goodNodes = allNodeTypes.filter(
        (nodeType) =>
          nodesWithKnownErrors.find((t2) => nodeType == t2) == undefined,
      );
      goodNodes.forEach((nodeType, index) => {
        if (index < 100) {
          cy.log('adding node: ' + nodeType);
          testController.addNode(nodeType, nodeType);
        }
      });
    });
  });
  it('check all for errors after placement', () => {
    cy.wait(1000);
    doWithTestController((testController) => {
      const allNodes = testController.getNodes();
      allNodes.forEach((node) => {
        expect(
          testController.doesNodeHaveError(node.id),
          node.name + ', any errors?',
        ).to.eq(false);
      });
    });
  });
  it('save graph', () => {
    cy.get('body').type('{ctrl}s');
  });
  // TODO RE-ENABLE AFTER BUGFIXES, THIS SHOULDNT BREAK!
  /*it("see that they are all there after loading again", () => {
      cy.visit('http://127.0.0.1:8080');
        cy.wait(1000);
        doWithTestController(testController => {
            expect(testController.getNodes().length).to.eq(numGoodNodes);

        });
    });
    */
});
