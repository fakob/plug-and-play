import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import styles from './utils/style.module.css';
import { getConfigData, writeTextToClipboard } from './utils/utils';
import {
  SerializedGraph,
  SerializedNode,
  SerializedSelection,
} from './utils/interfaces';
import { PP_VERSION } from './utils/constants';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import PPStorage from './PPStorage';
import { CodeEditor } from './components/Editor';

type ActionButtonProps = {
  source: PPGraph | PPNode;
  sourceCode: string;
};

function ActionButtons(props: ActionButtonProps) {
  const isNode = props.source instanceof PPNode;

  const replaceGraph = (sourceCode) => {
    const graphId = PPGraph.currentGraph.id;
    PPStorage.getInstance()
      .getGraphNameFromDB(graphId)
      .then((graphName) => {
        const newSerializedGraph = JSON.parse(sourceCode) as SerializedGraph;
        PPStorage.getInstance().loadGraphFromData(
          newSerializedGraph,
          graphId,
          graphName,
        );
      });
  };

  const replaceNode = () => {
    const newSerializedNode = JSON.parse(props.sourceCode) as SerializedNode;
    PPGraph.currentGraph.action_ReplaceNode(
      (props.source as PPNode).serialize(),
      newSerializedNode,
    );
  };

  const createNewNode = () => {
    const newSerializedSelection = JSON.parse(
      `{"version": ${PP_VERSION},"nodes": [${props.sourceCode}],"links": []}`,
    ) as SerializedSelection;
    PPGraph.currentGraph.action_pasteNodes(newSerializedSelection);
  };

  return isNode ? (
    <Box
      sx={{
        m: 1,
      }}
    >
      <ButtonGroup variant="outlined" size="small" fullWidth>
        <Button onClick={replaceNode}>Replace</Button>
        <Button onClick={createNewNode}>Create new</Button>
      </ButtonGroup>
    </Box>
  ) : (
    <Box
      sx={{
        m: 1,
      }}
    >
      <ButtonGroup variant="outlined" size="small" fullWidth>
        <Button onClick={() => replaceGraph(props.sourceCode)}>
          Replace playground with this config
        </Button>
      </ButtonGroup>
    </Box>
  );
}

type SourceContentProps = {
  header: string;
  editable: boolean;
  source: PPGraph | PPNode | string;
  randomMainColor: string;
};

export function SourceContent(props: SourceContentProps) {
  const sourceIsString = typeof props.source === 'string';
  const [sourceCode, setSourceCode] = useState('');

  useEffect(() => {
    setSourceCode('');
  }, [props.source]);

  const loadData = () => {
    const data = sourceIsString
      ? (props.source as string)
      : getConfigData(props.source as PPGraph | PPNode);
    setSourceCode(data);
  };

  return (
    <Box
      id={`inspector-source-content-${props.header}`}
      sx={{ bgcolor: 'background.paper' }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1,
          py: 0.5,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ pl: 0, color: 'text.primary' }}>{props.header}</Box>
          {!props.editable && (
            <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
          )}
          <IconButton
            size="small"
            onClick={() => writeTextToClipboard(sourceCode)}
            sx={{
              pl: 0.5,
              borderRadius: 0,
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
        <IconButton
          sx={{
            borderRadius: 0,
            right: '0px',
            fontSize: '16px',
            padding: 0,
            height: '24px',
            lineHeight: '150%',
          }}
          onClick={loadData}
          title="Load data"
          className={styles.menuItemButton}
        >
          <Box
            sx={{
              color: 'text.secondary',
              fontSize: '10px',
              px: 0.5,
            }}
          >
            Load data
          </Box>
          <RefreshIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      </Box>
      <CodeEditor
        value={sourceCode}
        randomMainColor={props.randomMainColor}
        editable={props.editable}
        onChange={(value) => {
          setSourceCode(value);
        }}
      />
      {!sourceIsString && sourceCode !== '' && (
        <ActionButtons
          source={props.source as PPGraph | PPNode}
          sourceCode={sourceCode}
        />
      )}
    </Box>
  );
}
