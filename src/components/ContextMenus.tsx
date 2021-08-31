import React from 'react';
import { Classes, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';

export const GraphContextMenu = (props) => {
  return (
    <Menu
      className={Classes.ELEVATION_1}
      style={{
        position: 'absolute',
        zIndex: 10,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuDivider title="Playground" />
      <MenuItem
        icon="search"
        text="Open playground"
        label={`${props.controlOrMetaKey}+O`}
        onClick={() => {
          props.setIsGraphSearchOpen(true);
        }}
      />
      <MenuItem
        icon="export"
        text="Load from file"
        onClick={() => {
          props.uploadGraph();
        }}
      />
      <MenuItem disabled text="" />
      <MenuItem
        icon="edit"
        text="Edit details"
        label={`${props.controlOrMetaKey}+E`}
        onClick={() => {
          props.setShowEdit(true);
        }}
      />
      <MenuItem
        icon="saved"
        text="Save"
        label={`${props.controlOrMetaKey}+S`}
        onClick={() => {
          props.saveGraph();
        }}
      />
      <MenuItem
        icon="saved"
        text="Save as new"
        label={`${props.controlOrMetaKey}+Shift+S`}
        onClick={() => {
          props.saveNewGraph();
        }}
      />
      <MenuItem
        icon="import"
        text="Download"
        onClick={() => {
          props.downloadGraph();
        }}
      />
      <MenuItem disabled text="" />
      <MenuItem
        icon="cross"
        text="Clear"
        onClick={() => {
          props.currentGraph.current.clear();
        }}
      />
      <MenuDivider title="Nodes" />
      <MenuItem
        icon="search"
        text="Find node"
        label={`${props.controlOrMetaKey}+F`}
        onClick={() => {
          props.openNodeSearch();
        }}
      />
      <MenuDivider title="Viewport" />
      <MenuItem
        icon="zoom-to-fit"
        text="Zoom to Fit"
        label={'Shift+1'}
        onClick={() => {
          props.zoomToFit();
        }}
      />
      <MenuDivider title="Debug" />
      <MenuItem
        text={`${props.showComments ? 'Hide' : 'Show'} output`}
        label={`${props.controlOrMetaKey}+Shift+Y`}
        onClick={() => {
          props.setShowComments((prevState) => !prevState);
        }}
      />
    </Menu>
  );
};

export const NodeContextMenu = (props) => {
  const canAddInput: boolean = props.currentGraph.current.getCanAddInput();
  const canAddOutput: boolean = props.currentGraph.current.getCanAddOutput();
  return (
    <Menu
      className={Classes.ELEVATION_1}
      style={{
        position: 'absolute',
        zIndex: 10,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuItem
        icon="duplicate"
        text="Duplicate"
        label={`${props.controlOrMetaKey}+D`}
        onClick={() => {
          props.currentGraph.current.duplicateSelection();
        }}
      />
      <MenuItem
        icon="trash"
        text="Delete"
        label="Delete"
        onClick={() => {
          props.currentGraph.current.deleteSelectedNodes();
        }}
      />
      {canAddInput && (
        <MenuItem
          text="Add Input"
          label="Add Input"
          onClick={() => {
            props.currentGraph.current.addInput();
          }}
        />
      )}
      {canAddOutput && (
        <MenuItem
          text="Add Output"
          label="Add Output"
          onClick={() => {
            props.currentGraph.current.addOutput();
          }}
        />
      )}
    </Menu>
  );
};
