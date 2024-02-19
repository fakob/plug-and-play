export function doWithTestController(inFunction, id = undefined) {
  cy.window().then(async (win) => {
    const anyWin = win as any;
    await inFunction(anyWin.testController);
    if (id !== undefined){
      anyWin.testController.spamToast(id);
    }
  });
  if (id !== undefined){
    cy.get("body").contains(id).should("exist");
  }
}

export function controlOrMetaKey() {
  return Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';
}

export function areCoordinatesClose(x1, y1, x2, y2, marginOfError = 1) {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance <= marginOfError;
}

export const getDeleteDialog = () => cy.get('[data-cy="deleteDialog"]');
export const getEditDialog = () => cy.get('[data-cy="editDialog"]');
export const getShareDialog = () => cy.get('[data-cy="shareDialog"]');

export function saveGraph() {
  cy.get('body').type(`${controlOrMetaKey()}s`);
  cy.get("body").contains("was saved").should("exist");
}

export function openEditGraph() {
  cy.get('body').type(`${controlOrMetaKey()}e`);
  cy.wait(200); // wait for text to be selected
}

export const dragFromAtoB = (startX, startY, endX, endY, wait = false) => {
  cy.get('body')
    .realMouseMove(startX, startY)
    .wait(wait ? 500 : 0) // adds waiting time when dragging connections
    .realMouseDown({ x: startX, y: startY })
    .realMouseMove(endX, endY)
    .realMouseUp({ x: endX, y: endY });
  cy.wait(1000);
};

export const addFirstTwoNodes = () => {
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
};

export const addTwoNodes = () => {
  doWithTestController((testController) => {
    expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
    expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  });
  cy.wait(100);
};

export const moveTwoNodes = () => {
  doWithTestController((testController) => {
    testController.moveNodeByID('Constant3', 0, -100);
    testController.moveNodeByID('Constant4', 230, -100);
  });
  cy.wait(100);
};

export const beforeEachMouseInteraction = () => {
  cy.visit('http://127.0.0.1:8080/?new=true');
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
  cy.showMousePosition();
};

export const afterEachMouseInteraction = () => {
  if (Cypress.$('#custom-mouse-pointer').length) {
    Cypress.$('#custom-mouse-pointer').remove();
  }
};

export const clickEditButtonOfGraph = (graphName) => {
  cy.get(`[data-cy="hover-${graphName}"]`)
    // .realHover()
    // .wait(1000)
    .find(`[data-cy="editButton"]`)
    .click({ force: true });
};

export const clickDeleteButtonOfGraph = (graphName) => {
  cy.get(`[data-cy="hover-${graphName}"]`)
    // .realHover()
    // .wait(1000)
    .find(`[data-cy="deleteButton"]`)
    .click({ force: true });
};

export const openExistingGraph = () => {
  cy.visit('http://127.0.0.1:8080');
  cy.get("body").contains("was loaded").should("exist");
}

export const openNewGraph = () => {
    cy.visit('http://127.0.0.1:8080/?new=true&toastEverything=true');
    cy.get("body").contains("startup_complete").should("exist");
}
