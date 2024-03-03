import { doWithTestController, openNewGraph } from '../helpers';

// describe('testMultiplyObject', () => {
//   it('Check index of multiply object', () => {
//     openNewGraph();
//     cy.showMousePosition();
//     doWithTestController((testController) => {
//       testController.addNode('DRAW_Shape', 'DRAW_Shape');
//       testController.addNode('DRAW_Multiplier', 'DRAW_Multiplier');
//     });
//     cy.wait(100);
//     doWithTestController((testController) => {
//       testController.moveNodeByID('DRAW_Shape', 0, -200);
//       testController.moveNodeByID('DRAW_Multiplier', 0, 100);
//       testController.connectNodesByID(
//         'DRAW_Shape',
//         'DRAW_Multiplier',
//         'Graphics',
//       );
//       testController.setNodeInputValue('DRAW_Shape', 'Offset X', 200);
//       testController.setNodeInputValue(
//         'DRAW_Multiplier',
//         'Clickable objects',
//         true,
//       );
//       cy.wait(1000);
//       testController.setNodeInputValue('DRAW_Multiplier', 'Spacing X', 200);
//       testController.setNodeInputValue('DRAW_Multiplier', 'Offset X', 0);
//       testController.executeNodeByID('DRAW_Shape');
//       expect(
//         testController.getNodeOutputValue(
//           'DRAW_Multiplier',
//           'LastPressedIndex',
//         ),
//       ).to.eq(-1);
//       cy.get('body').click(920, 530); // click on second circle
//     });
//     cy.wait(1000);
//     doWithTestController((testController) => {
//       expect(
//         testController.getNodeOutputValue(
//           'DRAW_Multiplier',
//           'LastPressedIndex',
//         ),
//       ).to.eq(1);
//     });
//     cy.wait(100);
//   });
// });
