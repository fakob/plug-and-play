import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { CodeType } from './datatypes/codeType';
import { NumberType } from './datatypes/numberType';
import { NODE_TYPE_COLOR } from '../utils/constants';

export class LogViewer extends PPNode {
  protected getIsHybrid(): boolean {
    return true;
  }
  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 640;
    const nodeHeight = 240;

    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
      nodeWidth,
      nodeHeight,
    });

    this.addInput('input', new CodeType(), customArgs?.data, true);
    this.addInput('rowLimit', new NumberType(true, 1, 1000), 100, false);

    this.name = 'LogViewer';
    this.description = 'View your logs';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(document, ParentComponent, {
        nodeHeight,
      });
    };

    this.onExecute = async function (input) {
      const newLogData = input['input'];
      const rowLimit = input['rowLimit'];
      this.renderReactComponent(ParentComponent, {
        data: newLogData,
        rowLimit,
      });
    };

    type MyProps = {
      data: string;
      randomMainColor: string;
      nodeHeight: number;
      rowLimit: number;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const [logString, setLogString] = useState<string[]>(
        props.data ? [props.data] : ['']
      );

      useEffect(() => {
        setLogString((prevArray) => {
          return [...prevArray.slice(-(props.rowLimit - 1)), props.data];
        });
      }, [props.data]);

      return (
        <ScrollFollow
          startFollowing={true}
          render={({ follow, onScroll }) => (
            <LazyLog
              text={logString.join('\r\n')}
              follow={follow}
              onScroll={onScroll}
              enableSearch
              caseInsensitive
              extraLines={1}
            />
          )}
        />
      );
    };
  }
}
