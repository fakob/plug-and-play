import { doWithTestController } from "./helpers";

// TODO add all nodes
describe('checkNodesForErrors', () => {
    it("add one of each node", () => {
      cy.visit('http://127.0.0.1:8080/?new=true');
      cy.wait(100);
      let allNodeTypes = [];

      // Fetch all node types and process them within the same test
      doWithTestController(testController => {
        allNodeTypes = testController.getAllDefinedNodeTypes();
        cy.log("all node types: " + JSON.stringify(allNodeTypes));
        });
        cy.wait(100);

        doWithTestController(testController => {
            const nodesWithKnownErrors: string[] = ["SqliteReader", "Image", "JSONSet", "PixotopeGatewayCall","DRAW_Shape","Table_GetColumnByName","PixotopeGatewayGet"]; // TODO FIX THESE !!!!
            allNodeTypes.filter(nodeType => (nodesWithKnownErrors.find(t2 => nodeType == t2) == undefined)).forEach((nodeType, index) => {
                if (index < 100) {
                    cy.log("adding node: " + nodeType);
                    testController.addNode(nodeType, nodeType);
                }
            });
        });
    });
    it("check all for errors after placement", () => {
        cy.wait(1000);
        doWithTestController(testController => {
            const allNodes = testController.getNodes();
            allNodes.forEach((node) => {
                expect(testController.doesNodeHaveError(node.id), node.name + ", any errors?").to.eq(false);
            });
        });
    });

});
