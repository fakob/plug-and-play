import { doWithTestController } from "./helpers";

describe('checkNodesForErrors', () => {
    it("add one of each node", () => {
        cy.visit('http://127.0.0.1:8080/?new=true');
        cy.wait(100);
        let allNodeTypes = [];

        // Fetch all node types and process them within the same test
        doWithTestController(testController => {
            allNodeTypes = testController.getAllDefinedNodeTypes();
            cy.log("all node types: " + JSON.stringify(allNodeTypes));


            //cy.wait(10000);
            //allNodeTypes.forEach(nodeType => {
            //    console.log("testing node type: " + nodeType);
            //    expect(testController.doesNodeHaveError(nodeType), "Expected there to not be any errors on spawned node of type: " + nodeType).to.eq(false);
            //});
        });
        cy.wait(100);

        doWithTestController(testController => {
            cy.wait(1000);
            allNodeTypes.forEach((nodeType, index) => {
                if (index < 20) {
                    cy.log("adding node: " + nodeType);
                    testController.addNode(nodeType, nodeType);
                }
            });
        });
    });
    it("check all for errors", () => {
        cy.wait(1000);
        doWithTestController(testController => {
            const allNodes = testController.getNodes();
            allNodes.forEach((node) => {
                expect(testController.doesNodeHaveError(node.id), node.name + ", any errors?").to.eq(false);
            });
        });
    });

});
