/* eslint-disable prettier/prettier */
describe('fundamentals', () => {
  it('Save Graph', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.get("body").type("{ctrl}s")
    cy.get("body").contains("Playground was saved").should("be.visible");
    cy.get('#\\:r3\\:').click();
    cy.get("body").type("{enter}");
    cy.get("body").contains("was loaded").should("be.visible");

  });
  it('Rename Graph', () => {
    //cy.visit('http://127.0.0.1:8080');
    cy.wait(1000); // TODO get rid of
    // change name of graph
    cy.get("body").type("{ctrl}e");
    cy.get('#playground-name-input').clear().type("Bingus{enter}");
    cy.contains("Bingus was loaded").should("be.visible");
  });
  it("Add node", () => {

    cy.get("body").type("{ctrl}f"); // node menu
    cy.get("body").type("Add{enter}"); // add node
    cy.get("body").type("{ctrl}a"); // select it
    // open inspector container
  });
  it("InspectorContainer", () => {

    cy.wait(5000);
    cy.get(':nth-child(1) > :nth-child(3) > :nth-child(1) > .MuiButtonBase-root', {timeout:10000}).click();
  });

  //it("Delete graph", () => {
//
 // };

});
