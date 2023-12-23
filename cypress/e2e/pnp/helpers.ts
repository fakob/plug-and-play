export function doWithTestController(inFunction) {
    cy.window().then(win => {
        const anyWin = win as any;
        inFunction(anyWin.testController);
    });
}