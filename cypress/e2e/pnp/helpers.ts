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
