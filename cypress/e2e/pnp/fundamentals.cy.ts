/* eslint-disable prettier/prettier */
describe('fundamentals', () => {
  const controlOrMetaKey = Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';

  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.intercept(
      'GET',
      'https://api.github.com/repos/fakob/plug-and-play-examples/branches/dev',
      {
        fixture: 'github-branches-dev.json',
      }
    );
    cy.intercept(
      'GET',
      'https://api.github.com/repos/fakob/plug-and-play-examples/git/trees/89985e29d08342d61c043b22f451c8a21ec862cf',
      {
        fixture: 'github-trees-sha.json',
      }
    );
    // cy.wait(2000); // ugly, wait for graphs to arrive
  });

  // it('Save Graph', () => {
  //   cy.visit('http://127.0.0.1:8080');
  // });
  /*cy.wait(3000);
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
  });*/

  //it("Delete graph", () => {
  //
  // };

  it('right click', () => {
    cy.get('#pixi-container > canvas').rightclick();
  });

  it('clear', () => {
    cy.get('#pixi-container > canvas').rightclick();
    cy.get(':nth-child(6) > .MuiListItemIcon-root').click();
    cy.get('#pixi-container > canvas').rightclick();
    cy.get(':nth-child(8) > .MuiListItemIcon-root').click();
  });

  it('add node', () => {
    cy.get('#pixi-container > canvas').dblclick();
    cy.focused().type('Add{enter}');
  });

  it('add node using PPGraph', () => {
    cy.wait(100);
    cy.getPPGraph().then((obj) => {
      cy.log(obj);
      const prom = obj.addNewNode('Add');
      cy.wrap(prom).then((node) => {
        obj.selection.selectNodes([node], false, true);
      });
    });
    cy.get('body').type(`${controlOrMetaKey}\\`);
  });
});
