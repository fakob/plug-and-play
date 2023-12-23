// TODO implement
describe('serializeLogic', () => {

    let serialized = undefined;
    it("Add nodes and connect", () => {
        cy.visit('http://127.0.0.1:8080/?new=true');

        // add nodes
        cy.wait(100);
        cy.window().then(win => {
            const anyWin = win as any;
            expect(anyWin.testController.addNode("Add", "Add1")).to.eq(true);
            expect(anyWin.testController.addNode("Add", "Add2")).to.eq(true);
        });
        cy.wait(100);

        // connect nodes together
        cy.window().then(win => {
            const anyWin = win as any;
            anyWin.testController.moveNodeByID("Add1", -200, 0);
            anyWin.testController.connectNodesByID("Add1", "Add2", "Added");
        });

    });

    it("clear graph", () => {
        // serialize and clear it
        cy.wait(100);
        cy.window().then(win => {
            const anyWin = win as any;
            serialized = anyWin.testController.getGraph().serialize();
            anyWin.testController.getGraph().clear();
            expect(anyWin.testController.getNodes().length).to.eq(0);
        });

    });


    it("deserialize", () => {
        // deserialize, see if it looks any similar
        cy.wait(100);
        cy.window().then(win => {
            const anyWin = win as any;
            anyWin.testController.getGraph().configure(serialized);
        });

        cy.wait(100);
        cy.window().then(win => {
            const anyWin = win as any;
            expect(anyWin.testController.getNodes().length).to.eq(2);
        });

    });
});