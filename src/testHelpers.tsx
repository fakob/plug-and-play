import PPGraph from './classes/GraphClass';
export function pixiReactVisualize(visualize: boolean) {
  const graph = PPGraph.currentGraph;
  const nodes = Object.values(graph.nodes);

  const reactElement = document.createElement('div');
  this.container = document
    .getElementById('container')
    .appendChild(reactElement);
  this.root = createRoot(this.container!);
  this.container.id = `Container-${this.id}`;

  const scale = PPGraph.currentGraph.viewportScaleX;
  this.container.classList.add(styles.hybridContainer);
  Object.assign(this.container.style, customStyles);

  // set initial position
  this.container.style.width = `${this.nodeWidth}px`;
  this.container.style.height = `${this.nodeHeight}px`;
  this.container.style.transform = `scale(${scale}`;

  this.onNodeDragOrViewportMove = this.redraw;

  this.onViewportPointerUpHandler = this.onViewportPointerUp.bind(this);

  // when the Node is removed also remove the react component and its container
  this.onNodeRemoved = () => {
    this.removeContainerComponent(this.container, this.root);
  };

  // render react component
  this.renderReactComponent(
    {
      ...reactProps,
    },
    this.root,
    this,
  );

  this.refreshNodeDragOrViewportMove();
}

// the render method, takes a component and props, and renders it to the page
function renderReactComponent = (
  props: {
    [key: string]: any;
  },
  root = this.root,
  node: PPNode = this,
): void => {
  root.render(
    <>
      <this.getParentComponent
        initialData={this.initialData} // positioned before the props so it can be overwritten by them
        {...props}
        id={this.id}
        selected={this.selected}
        doubleClicked={this.doubleClicked}
        randomMainColor={RANDOMMAINCOLOR}
        node={node}
      />
      <HybridNodeOverlay
        doubleClicked={this.doubleClicked}
        getActivateByDoubleClick={this.getActivateByDoubleClick()}
        isHovering={this.isHovering}
        onEditButtonClick={this.onEditButtonClick.bind(this)}
      />
    </>,
  );
};
