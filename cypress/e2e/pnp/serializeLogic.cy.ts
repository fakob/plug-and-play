import { doWithTestController } from "./helpers"
describe('serializeLogic', () => {

    let serialized = undefined;
    it("Add nodes and connect", () => {
        cy.visit('http://127.0.0.1:8080/?new=true');

        // add nodes
        cy.wait(100);
        doWithTestController(testController => {
            expect(testController.addNode("Add", "Add1")).to.eq(true);
            expect(testController.addNode("Add", "Add2")).to.eq(true);
        });
        cy.wait(100);
        // connect nodes together
        doWithTestController(testController => {
            testController.moveNodeByID("Add1", -200, 0);
            testController.connectNodesByID("Add1", "Add2", "Added");
        });

    });

    it("clear graph", () => {
        // serialize and clear it
        cy.wait(100);
        doWithTestController(testController => {
            serialized = testController.getGraph().serialize();
            testController.getGraph().clear();
            expect(testController.getNodes().length).to.eq(0);

        })
    });


    it("deserialize", () => {
        // deserialize, see if it looks any similar
        cy.wait(100);
        doWithTestController(testController => {
            testController.getGraph().configure(serialized);
        });

        cy.wait(100);
        doWithTestController(testController => {
            expect(testController.getNodes().length).to.eq(2);

        });

    });
});