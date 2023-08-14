/* eslint-disable prettier/prettier */

describe('fundamentals', () => {
  const controlOrMetaKey = Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';
  const myGraphName = 'Bingus';

  function openInspectorAndCheckForName(nameOfNode) {
    cy.get('body').type(`${controlOrMetaKey}\\`); // open inspector
    cy.get('#inspector-filter-common').contains('Common').should('exist');
    // cy.get('#:ri:').contains(nameOfNode).should('exist');
    cy.get('body').type(`${controlOrMetaKey}\\`);
  }

  function checkToastForMessage(messageToSearchFor) {
    cy.wait(1000)
      .get('[id^="notistack-snackbar"]')
      .contains(messageToSearchFor)
      .should('exist');
  }

  beforeEach(() => {
    cy.intercept('GET', '/listExamples', (req) => {
      req.reply({
        statusCode: 200,
        fixture: 'listExamples.json',
      });
    }).as('listExamples');
  });

  it('Add node with double click', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.get('#pixi-container > canvas').dblclick();
    cy.focused().type('Add{enter}');
    cy.get('body').type(`${controlOrMetaKey}a`); // select all
    openInspectorAndCheckForName('Add');
  });

  it('Add node with shortcut', () => {
    cy.get('body').type(`${controlOrMetaKey}f`); // node search
    cy.get('body').type('Subtract{enter}');
    openInspectorAndCheckForName('Subtract');
  });

  it('Add node using PPGraph', () => {
    cy.wait(100);
    cy.getPPGraph().then((obj) => {
      cy.log(obj);
      const prom = obj.addNewNode('Multiply');
      cy.wrap(prom).then((node) => {
        obj.selection.selectNodes([node], false, true);
        openInspectorAndCheckForName('Multiply');
      });
    });
  });

  it('Save Graph', () => {
    cy.wait(3000);
    cy.get('body').type(`${controlOrMetaKey}s`);
    checkToastForMessage('Playground was saved');
  });

  // triggers error: Failed to execute 'get' on 'IDBObjectStore': No key or key range specified.
  // it('Rename Graph', () => {
  //   cy.get('body').type(`${controlOrMetaKey}e`);
  //   cy.get('#playground-name-input').clear().type(`${myGraphName}{enter}`);
  //   cy.wait(1000)
  //     .get('#notistack-snackbar')
  //     .contains(`${myGraphName} was loaded`)
  //     .should('exist');
  // });

  it('Delete graph', () => {
    cy.get('body').type(`${controlOrMetaKey}o`);
    cy.wait(1000)
      .get(
        '#graph-search-option-1 > .MuiButtonGroup-root > [title="Delete playground"]'
      )
      .click();
    cy.get('.MuiDialogActions-root > :nth-child(2)').click();
    checkToastForMessage('Playground was deleted');
  });

  it('Load graph example', () => {
    cy.get('body').type(`${controlOrMetaKey}o`);
    cy.wait(1000)
      .get('#graph-search-listbox')
      .contains('li', 'z test node')
      .click();
    checkToastForMessage('Remote playground was loaded');
  });

  // doesnt work yet as it rightclicks with a node underneath
  // triggering the node context menu instead of the graph context menu
  // it('clear', () => {
  //   cy.get('#pixi-container > canvas').rightclick();
  //   cy.get(':nth-child(8) > .MuiListItemIcon-root').click();
  //   cy.get('body').click();
  // });
});
