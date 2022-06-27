import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { CodeType } from './datatypes/codeType';
import { NumberType } from './datatypes/numberType';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';

export class LogViewer extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 640;
    const nodeHeight = 240;

    super(name, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
    });

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

  public getName(): string {
    return 'LogViewer';
  }

  public getDescription(): string {
    return 'View your logs';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, 'input', new CodeType(), '', true),
      new PPSocket(
        SOCKET_TYPE.IN,
        'rowLimit',
        new NumberType(true, 1, 1000),
        100,
        false
      ),
    ];
  }

  protected getIsHybrid(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return true;
  }
}
