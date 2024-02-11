import { controlOrMetaKey, doWithTestController, saveGraph } from './helpers';

describe('macro', () => {
  const checkDropdownWorks = () => {
    doWithTestController((testController) => {
      testController.selectNodesById(['ExecuteMacro']);
      // if this breaks, maybe ID has changed
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.get('.MuiSelect-select').click();
      cy.get('body').contains('Macro0').click();
    });
  };

  it('Add macro nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    // add the nodes
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Macro', 'Macro')).to.eq(true);
      expect(testController.addNode('Add', 'Add')).to.eq(true);

      expect(testController.addNode('Constant', 'Constant')).to.eq(true);
      expect(testController.addNode('ExecuteMacro', 'ExecuteMacro')).to.eq(
        true,
      );
    });
  });

  it('Connect macro nodes', () => {
    cy.wait(100);
    // connect up inside macro
    doWithTestController((testController) => {
      testController.moveNodeByID('Add', 200, 100);
      testController.moveNodeByID('ExecuteMacro', 0, -200);
      testController.moveNodeByID('Constant', -200, -200);
      testController.connectNodesByID('Macro', 'Add', 'Parameter 1');
      testController.connectNodesByID('Add', 'Macro', 'Added');
    });
  });

  it('Select executemacro and select macro from dropdown', () => {
    checkDropdownWorks();
  });

  it('Set up macro caller env', () => {
    doWithTestController((testController) => {
      testController.connectNodesByID('Constant', 'ExecuteMacro', 'Out');
      testController.setNodeInputValue('Constant', 'In', 10);
      testController.executeNodeByID('Constant');
    });
  });

  it('See that the macro runs as expected when called from outside (it should be passthrough)', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      expect(
        testController.getNodeOutputValue('ExecuteMacro', 'OutData', 10),
      ).to.eq(10);
    });
  });
  it('Save graph', () => {
    cy.wait(100);
    saveGraph();
    cy.wait(100);
  });

  it('See that dropdown still works after reload', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(4000);
    doWithTestController((testController) => {
      testController.selectNodesById(['ExecuteMacro']);
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.contains('Macro0').click();
      cy.get('body').type('{enter}');
    });
  });
  it('See that everything is selected when graph is selected', () => {
  doWithTestController((testController) => {
      testController.selectNodesById(['Macro']);
    expect(testController.getSelectedNodes().length).to.eq(3);
  });
  });

});
