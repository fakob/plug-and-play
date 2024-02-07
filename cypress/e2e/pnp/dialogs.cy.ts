import {
  clickDeleteButtonOfGraph,
  clickEditButtonOfGraph,
  controlOrMetaKey,
  doWithTestController,
  openEditGraph,
} from './helpers';

describe('dialogs', () => {
  let graphName;
  let secondGraphName;
  const newGraphName = 'My playground';
  const newSecondGraphName = 'My 2nd playground';

  const getEditDialog = () => cy.get('[data-cy="editDialog"]');
  const getDeleteDialog = () => cy.get('[data-cy="deleteDialog"]');

  before(() => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    doWithTestController((testController) => {
      const coordinates = testController.deleteAllGraphs();
      // cy.get('body').click(coordinates[0], coordinates[1]);
    });
    cy.wait(100);
    // cy.get('body').type(`${controlOrMetaKey()}{shift}Y`); // enable debug view
    cy.get('body').type('1'); // close left side menu
    doWithTestController((testController) => {
      testController.setShowUnsavedChangesWarning(false);
      expect(testController.addNode('Constant', 'Constant1')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant2')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant2', 230, 0);
      testController.connectNodesByID('Constant1', 'Constant2', 'Out', 'In');
    });
    cy.get('body').type('1'); // close left side menu
    cy.get('body').type(`${controlOrMetaKey()}s`); // save graph
    cy.wait(1000)
      .get('[id^="notistack-snackbar"]')
      .contains('was saved')
      .invoke('text')
      .then((text) => {
        const match = text.match(/Playground (.+?) was saved/);
        if (match) {
          graphName = match[1];
          cy.log(graphName);
        }
      });
  });

  beforeEach(() => {
    // cy.get('body').click(500, 100); // click outside to close eventual dialogs
    // cy.reload();
  });

  // Edit graph dialog of current graph
  it('Opens and closes edit graph dialog via clicking cancel', () => {
    openEditGraph();
    getEditDialog().contains('Edit playground details');
    getEditDialog().contains('Cancel').click();
    getEditDialog().should('not.exist');
  });

  it('Opens and closes edit graph dialog via clicking outside', () => {
    openEditGraph();
    getEditDialog().contains('Edit playground details');
    cy.get('body').click(500, 100); // click outside
    getEditDialog().should('not.exist');
  });

  it('Opens and closes edit graph dialog via shortcuts', () => {
    openEditGraph();
    getEditDialog().contains('Edit playground details');
    getEditDialog().type('{esc}');
    getEditDialog().should('not.exist');
  });

  it('Checks if graph name is selected', () => {
    openEditGraph();
    cy.document().then((doc) => {
      const selectedText = doc.getSelection().toString();
      expect(selectedText).to.equal(graphName);
    });
    getEditDialog().contains('Cancel').click();
  });

  it('Changes graph name after graph name change and clicking save', () => {
    openEditGraph();
    cy.get('#playground-name-input').type(`${newGraphName}{enter}`);
    cy.wait(1000)
      .get('.notistack-SnackbarContainer')
      .contains(`Name changed to ${newGraphName}`)
      .should('exist');
    clickEditButtonOfGraph(newGraphName);
    cy.get('#playground-name-input').should('have.value', newGraphName);
    getEditDialog().contains('Cancel').click();
  });

  // Edit graph dialog of other graph
  it('Changes graph name of other graph after graph name change and clicking save', () => {
    cy.get('body').type(`${controlOrMetaKey()}{shift}s`); // save new graph
    cy.wait(1000)
      .get('[id^="notistack-snackbar"]')
      .last()
      .contains('was saved')
      .invoke('text')
      .then((text) => {
        const match = text.match(/Playground (.+?) was saved/);
        if (match) {
          secondGraphName = match[1];
          cy.log(secondGraphName);
          clickEditButtonOfGraph(secondGraphName);
          cy.wait(200);
          cy.get('#playground-name-input').type(`${newSecondGraphName}{enter}`);
          cy.wait(1000)
            .get('.notistack-SnackbarContainer')
            .contains(`Name changed to ${newSecondGraphName}`)
            .should('exist');
          clickEditButtonOfGraph(newSecondGraphName);
          cy.get('#playground-name-input').should(
            'have.value',
            newSecondGraphName,
          );
          getEditDialog().contains('Cancel').click();
        }
      });
  });

  // Delete graph dialog
  it('Opens and closes delete graph dialog via clicking cancel', () => {
    clickDeleteButtonOfGraph(newGraphName);
    getDeleteDialog().contains('Delete playground');
    getDeleteDialog().contains('Cancel').click();
    getDeleteDialog().should('not.exist');
  });

  it('Opens and closes delete graph dialog via clicking outside', () => {
    clickDeleteButtonOfGraph(newGraphName);
    getDeleteDialog().contains('Delete playground');
    cy.get('body').click(500, 100); // click outside
    getDeleteDialog().should('not.exist');
  });

  it('Deletes other graph after clicking delete', () => {
    clickDeleteButtonOfGraph(newGraphName);
    getDeleteDialog().contains('Delete playground');
    getDeleteDialog().contains('button', 'Delete').click();
    getDeleteDialog().should('not.exist');
    cy.get(`[data-cy="hover-${newGraphName}"]`).should('not.exist');
  });

  it('Deletes current graph after clicking delete', () => {
    clickDeleteButtonOfGraph(newSecondGraphName);
    getDeleteDialog().contains('Delete playground');
    getDeleteDialog().contains('button', 'Delete').click();
    getDeleteDialog().should('not.exist');
    cy.get(`[data-cy="hover-${newSecondGraphName}"]`).should('not.exist');
  });

  // Share graph dialog
  it('Opens and closes share graph dialog via clicking cancel', () => {});
  it('Opens and closes share graph dialog via clicking outside', () => {});
  it('Download graph after clicking download', () => {});
  it('Login to github after clicking login', () => {});
});
