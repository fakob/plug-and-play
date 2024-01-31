export function doWithTestController(inFunction) {
  cy.window().then((win) => {
    const anyWin = win as any;
    inFunction(anyWin.testController);
  });
}

export function controlOrMetaKey() {
  return Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';
}

export function areCoordinatesClose(x1, y1, x2, y2, marginOfError = 1) {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance <= marginOfError;
}

export function saveGraph(){
    cy.get('body').type(`${controlOrMetaKey()}s`);
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
  cy.get('body').type('1'); // enable debug view
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
