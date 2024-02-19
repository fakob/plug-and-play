import { doWithTestController, openNewGraph } from '../helpers';
describe('nodeInteractions', () => {
  it('Add node', () => {
    openNewGraph();

    doWithTestController(async (testController) => {
      await testController.addNode('Add', 'Add');
    },"addNode");
    doWithTestController((testController) => {
      expect(testController.getNodes().length).to.eq(1);
    });
  });
});
