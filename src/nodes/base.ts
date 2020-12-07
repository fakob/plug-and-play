import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';

export class TimeAndDate extends PPNode {
  date: Date;

  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    // this.addInput('in', 'number');
    this.addOutput('date and time', 'string');
    this.addOutput('time stamp', 'number');

    this.title = 'Time';
    this.type = 'BaseTime';
    this.description = 'Outputs current time in different formats';
    this.date = new Date();

    this.onExecute = function () {
      // const a = this.getInputData(0) || 0;
      this.setOutputData(0, this.date.getUTCDate());
      // this.setOutputData(1, this.date.getTime());
      this.setOutputData(1, Date.now());
      console.log(this.result);
    };
  }
}
