import { doWithTestController, openNewGraph } from '../helpers';

function exposeSelectedLabelOutput() {
  cy.get('[data-cy="inspector-container-toggle-button"]').click();
  cy.get('#inspector-filter-out').click();
  cy.get('[data-cy="socket-visible-button"]').click();
}

describe('dataTypes', () => {
  it('setup some nodes', () => {
    openNewGraph();
    doWithTestController(async (testController) => {
      await testController.addNode('WidgetSlider', 'Slider');
      await testController.addNode('Label', 'Label');
      await testController.addNode('CustomFunction', 'CustomFunction');
      await testController.addNode("ArrayCreate","ArrayCreate", 0, -200);
      await testController.addNode("Concatenate","Concatenate", 200, -200);
    }, "addInitialNodes");
  });
  it('expose label output', () => {
    doWithTestController((testController) => {
      testController.moveNodeByID('Slider', 0, 100);
      testController.moveNodeByID('CustomFunction', 200, 0);
      // expose output on label
      testController.selectNodesById(['Label']);
      exposeSelectedLabelOutput();
    });
  });

  it('write some text in the label node, see that it registers', () => {
    doWithTestController((testController) => {
      const [x, y] = testController.getNodeCenterById('Label');
      cy.get('body').dblclick(x, y);
      cy.get('body').type('testin');
    });
    doWithTestController((testController) => {
      const value = testController.getNodeOutputValue('Label', 'Output');
      expect(value).to.eq('testin');
    });
  });
  it("see that the customfunction input is of type 'any'", () => {
    doWithTestController((testController) => {
      const type = testController.getInputSocketType('CustomFunction', 'a');
      expect(type).to.eq('Any');
    });
  });
  it('connect label node with customfunction node', () => {
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Label', 'CustomFunction', 'Output');
    }, "connectem");
  });
  it('see that customfunction input and output are now of string type', () => {
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('CustomFunction', 'a')).to.eq(
        'String',
      );
      expect(
        testController.getOutputSocketType('CustomFunction', 'OutData'),
      ).to.eq('String');
    });
  });
  it('connect slider with customfunction node', () => {
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Slider', 'CustomFunction', 'Out');
    }, "connectem2");
  });
  it('see that customfunction input and output are now of number type', () => {
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('CustomFunction', 'a')).to.eq(
        'Number',
      );
      expect(
        testController.getOutputSocketType('CustomFunction', 'OutData'),
      ).to.eq('Number');
    });
  });
  it('customfunction, manually change the type and see that it propagates and parses', () => {
    doWithTestController((testController) => {
      testController.selectNodesById(['CustomFunction']);
      cy.get('#inspector-filter-in').click();
      cy.get('[data-cy="a-type-selector-button"]').click();
      cy.get('[value="StringType"]').click();
      cy.get('#inspector-filter-common').click();
      cy.get('[data-cy="update-now-button"]').click();
      cy.get('#inspector-filter-out').click();
      cy.get('[data-cy="OutData-type-selector-button"]').should(
        'contain',
        'String',
      );
    });
  });

  it("see that we adapt as expected to changing between array and string input", () => {
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('ArrayCreate', 'Concatenate', 'Array');
    }, "connectem3");
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Label', 'Concatenate', 'Output', "Array");
    }, "connectem4");

    doWithTestController((testController) => {
      expect(
        testController.getInputSocketType('Concatenate', 'Array'),
      ).to.eq('String');
    });
  })


  it('see that macro adapts as expected when changing the type going out of it', () => {
    openNewGraph();

    doWithTestController(async (testController) => {
      await testController.addNode('Macro', 'Macro');
      await testController.addNode('Label', 'Label');
    }, "addmacro");
    // we first expect the output to be "any"
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq('Any');
      testController.selectNodesById(['Label']);
    });
    // we first expect the output to be "any"
    doWithTestController((testController) => {
      exposeSelectedLabelOutput();
    });
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Label', 'Macro', 'Output');
    },"macroconnect");
    // then when i connect string into it, to change into string
    doWithTestController(async (testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'String',
      );
      await testController.disconnectLink('Macro', 'Output');
    }, "flipitup");
    // when when disconnecting, and going back to default value which is 0, to number
    doWithTestController(async (testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'Number',
      );
      await testController.connectNodesByID('Label', 'Macro', 'Output');
    }, "whatsup");
    // then back to string
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'String',
      );
    });
  });

});
