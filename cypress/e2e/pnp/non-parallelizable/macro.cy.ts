import { doWithTestController, openExistingGraph, openNewGraph, saveGraph, } from '../helpers';

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
    openNewGraph();
    doWithTestController(async (testController) => {
      await testController.addNode('Macro', 'Macro');
      await testController.addNode('Add', 'Add');

      await testController.addNode('Constant', 'Constant');
      await testController.addNode('ExecuteMacro', 'ExecuteMacro');
    }, "addInitialNodes");
  });

  it('Connect macro nodes', () => {
    // connect up inside macro
    doWithTestController(async (testController) => {
      testController.moveNodeByID('Add', 200, 100);
      testController.moveNodeByID('ExecuteMacro', 0, -200);
      testController.moveNodeByID('Constant', -200, -200);
      await testController.connectNodesByID('Macro', 'Add', 'Parameter 1');
      await testController.connectNodesByID('Add', 'Macro', 'Added');
    }, "connecting");
  });

  it('Select executemacro and select macro from dropdown', () => {
    checkDropdownWorks();
  });

  it('Set up macro caller env', () => {
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Constant', 'ExecuteMacro', 'Out');
      testController.setNodeInputValue('Constant', 'In', 10);
      await testController.executeNodeByID('Constant');
    }, "setupStuff");
  });

  it('See that the macro runs as expected when called from outside (it should be passthrough)', () => {
    doWithTestController((testController) => {
      expect(
        testController.getNodeOutputValue('ExecuteMacro', 'OutData', 10),
      ).to.eq(10);
    });
  });
  it('Save graph', () => {
    saveGraph();
  });

  it('See that dropdown still works after reload', () => {
    openExistingGraph();
    doWithTestController((testController) => {
      testController.selectNodesById(['ExecuteMacro']);
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.contains('Macro0').click();
      cy.get('body').type('{enter}');
    });
  });
  it('See that not everything is selected when graph is selected', () => {
  doWithTestController((testController) => {
      testController.selectNodesById(['Macro']);
      expect(testController.getSelectedNodes().length).to.eq(1);
  });
  });

});
