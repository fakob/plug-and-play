import { doWithTestController } from './helpers';

function exposeSelectedLabelOutput() {
  cy.get('[data-cy="inspector-container-toggle-button"]').click();
  cy.get('#inspector-filter-out').click();
  cy.get('[data-cy="socket-visible-button"]').click();
}

describe('dataTypes', () => {
  it('setup some nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(200);
    doWithTestController((testController) => {
      expect(testController.addNode('WidgetSlider', 'Slider')).to.eq(true);
      expect(testController.addNode('Label', 'Label')).to.eq(true);
      expect(testController.addNode('CustomFunction', 'CustomFunction')).to.eq(
        true,
      );
    });
  });
  it('expose label output', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Slider', 0, 100);
      testController.moveNodeByID('CustomFunction', 200, 0);
      // expose output on label
      testController.selectNodesById(['Label']);
      exposeSelectedLabelOutput();
    });
  });

  it('write some text in the label node, see that it registers', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      const [x, y] = testController.getNodeCenterById('Label');
      cy.wait(100);
      cy.get('body').dblclick(x, y);
      cy.get('body').type('testin');
    });
    cy.wait(100);
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
    doWithTestController((testController) => {
      testController.connectNodesByID('Label', 'CustomFunction', 'Output');
    });
  });
  it('see that customfunction input and output are now of string type', () => {
    cy.wait(100);
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
    doWithTestController((testController) => {
      testController.connectNodesByID('Slider', 'CustomFunction', 'Out');
    });
  });
  it('see that customfunction input and output are now of number type', () => {
    cy.wait(100);
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
    cy.wait(100);
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

  it('see that macro adapts as expected when changing the type going out of it', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(200);

    doWithTestController((testController) => {
      testController.addNode('Macro', 'Macro');
      testController.addNode('Label', 'Label');
    });
    cy.wait(100);
    // we first expect the output to be "any"
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq('Any');
      testController.selectNodesById(['Label']);
    });
    cy.wait(100);
    // we first expect the output to be "any"
    doWithTestController((testController) => {
      exposeSelectedLabelOutput();
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.connectNodesByID('Label', 'Macro', 'Output');
    });
    cy.wait(100);
    // then when i connect string into it, to change into string
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'String',
      );
      testController.disconnectLink('Macro', 'Output');
    });
    cy.wait(100);
    // when when disconnecting, and going back to default value which is 0, to number
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'Number',
      );
      testController.connectNodesByID('Label', 'Macro', 'Output');
    });
    cy.wait(100);
    // then back to string
    doWithTestController((testController) => {
      expect(testController.getInputSocketType('Macro', 'Output')).to.eq(
        'String',
      );
    });
  });
});
