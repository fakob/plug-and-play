// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to get PIXI.App
     * @example cy.getPIXIApp();
     */
    getPIXIApp(): Chainable;
    /**
     * Custom command to get Viewport
     * @example cy.getPPViewport();
     */
    getPPViewport(): Chainable;
    /**
     * Custom command to get PPGraph
     * @example cy.getPPGraph();
     */
    getPPGraph(): Chainable;
    /**
     * Custom command to get PPSelection
     * @example cy.getPPSelection();
     */
    getPPSelection(): Chainable;
  }
}

Cypress.Commands.add('getPIXIApp', () => {
  cy.window().then((win) => {
    cy.log((win as any).__PIXI_APP__);
    return cy.wrap((win as any).__PIXI_APP__);
  });
});

Cypress.Commands.add('getPPViewport', () => {
  cy.window().then((win) => {
    cy.log((win as any).__VIEWPORT__);
    return cy.wrap((win as any).__VIEWPORT__);
  });
});

Cypress.Commands.add('getPPGraph', () => {
  cy.window().then((win) => {
    cy.log((win as any).__PPGRAPH__);
    return cy.wrap((win as any).__PPGRAPH__);
  });
});

Cypress.Commands.add('getPPSelection', () => {
  cy.window().then((win) => {
    cy.log((win as any).__PPSELECTION__);
    return cy.wrap((win as any).__PPSELECTION__);
  });
});
