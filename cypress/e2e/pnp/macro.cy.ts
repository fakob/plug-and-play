import { doWithTestController } from "./helpers";

describe('macro', () => {

    it('Add macro nodes', () => {
        cy.visit('http://127.0.0.1:8080/?new=true');
        // add the nodes
        cy.wait(100);
        doWithTestController(testController => {
            expect(testController.addNode("Macro", "Macro")).to.eq(true);
            expect(testController.addNode("Add", "Add")).to.eq(true);

            expect(testController.addNode("Constant", "Constant")).to.eq(true);
            expect(testController.addNode("ExecuteMacro", "ExecuteMacro")).to.eq(true);
        })
    });

    it("Connect macro nodes", () => {
        cy.wait(100);
        // connect up inside macro
        doWithTestController(testController => {
            testController.moveNodeByID("Add", 200, 100);
            testController.moveNodeByID("ExecuteMacro", 0, -200);
            testController.moveNodeByID("Constant", -200, -200);
            testController.connectNodesByID("Macro", "Add", "Parameter 1");
            testController.connectNodesByID("Add", "Macro", "Added");

        });
    });

    it("Select executemacro and select macro from dropdown", () => {
        doWithTestController(testController => {
            testController.selectNodesById(["ExecuteMacro"]);
            // if this breaks, maybe ID has changed
            cy.get('#drawer-toggle-inspector > .MuiButtonBase-root').click();
            cy.get('.MuiSelect-select').click();
            cy.get("body").contains("Macro0").click();

        });
    });

    it("Set up macro caller env", () => {
        doWithTestController(testController => {
            testController.connectNodesByID("Constant", "ExecuteMacro", "Out");
            testController.setNodeInputValue("Constant", "In", 10);
            testController.executeNodeByID("Constant");
        });
    });

    it("See that the macro runs as expected when called from outside (it should be passthrough)", () => {
        cy.wait(100);
        doWithTestController(testController => {
            expect(testController.getNodeOutputValue("ExecuteMacro", "OutData", 10)).to.eq(10);
        });

    });
});
