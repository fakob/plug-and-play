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
      <MenuItem
        icon="search"
        text="Search nodes"
        label={`${props.controlOrMetaKey}+F`}
        onClick={() => {
          props.setIsSearchOpen(true);
          props.nodeSearchInput.current.focus();
        }}
      />
      <MenuDivider title="Graph" />
      <MenuItem
        icon="document"
        text="Recall graph"
        onClick={() => {
          props.loadCurrentGraph();
        }}
      />
      <MenuItem
        icon="saved"
        text="Store graph"
        label={`${props.controlOrMetaKey}+S`}
        onClick={() => {
          props.serializeGraph();
        }}
      />
      <MenuItem disabled text="" />
      <MenuItem
        icon="export"
        text="Load graph from file"
        onClick={() => {
          props.uploadGraph();
        }}
      />
      <MenuItem
        icon="import"
        text="Download graph"
        onClick={() => {
          props.downloadGraph();
        }}
      />
      <MenuItem disabled text="" />
      <MenuItem
        icon="cross"
        text="Clear graph"
        onClick={() => {
          props.currentGraph.current.clear();
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
      <MenuDivider />
      <MenuItem
        text={props.showComments ? 'Hide Comments' : 'Show Comments'}
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
