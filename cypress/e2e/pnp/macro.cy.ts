
// TODO implement
describe('macro', () => {

    it('Add macro and add node', () => {

        cy.visit('http://127.0.0.1:8080/?new=true');

        cy.wait(100);
        cy.window().then(win => {
            const anyWin = win as any;
            expect((win as any).testController.addNode("Macro", "Macro")).to.eq(true);
            expect((win as any).testController.addNode("Add", "Add")).to.eq(true);
        });
        cy.wait(100);
        cy.window().then(win => {
            //expect((win as any).testController.getNodes().length).to.eq(2);


        });
    });
});