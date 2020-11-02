export const addNode = {
  name: 'Add Node',
  type: 'math',
  inputs: [
    {
      name: 'Input 1',
      type: 'number',
    },
    {
      name: 'Input 2',
      type: 'number',
    },
  ],
  outputs: [
    {
      name: 'Output 1',
      type: 'number',
    },
  ],
};

export const watchNode = {
  name: 'Watch Node',
  type: 'math',
  inputs: [
    {
      name: 'Watcher 1',
      type: 'string',
    },
  ],
};
