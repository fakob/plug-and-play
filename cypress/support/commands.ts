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
    /**
     * Custom command to show the mouse position
     * @example cy.showMousePosition();
     */
    showMousePosition(): Chainable;
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

Cypress.Commands.add('showMousePosition', () => {
  const cursor = Cypress.$('<div>')
    .css({
      position: 'absolute',
      height: '20px',
      width: '20px',
      backgroundColor: 'red',
      borderRadius: '10px',
      zIndex: 10000,
      transform: 'translate(-50%, -50%)', // Center the dot
      pointerEvents: 'none', // Allows click events to pass through
    })
    .attr('id', 'custom-mouse-pointer');

  Cypress.$('body').append(cursor);

  cy.get('body').then(($body) => {
    $body.on('mousemove', (e) => {
      Cypress.$('#custom-mouse-pointer').css({
        top: e.clientY,
        left: e.clientX,
      });
    });
  });
});
