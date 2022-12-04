import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import PPSocket from '../classes/SocketClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { AnyType } from './datatypes/anyType';
import { NumberType } from './datatypes/numberType';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import HybridNode from '../classes/HybridNode';

export class LogViewer extends HybridNode {
  public getName(): string {
    return 'LogViewer';
  }

  public getDescription(): string {
    return 'View your logs';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, 'input', new AnyType(), '', true),
      new PPSocket(
        SOCKET_TYPE.IN,
        'rowLimit',
        new NumberType(true, 1, 1000),
        100,
        false
      ),
    ];
  }

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  public getOpacity(): number {
    return 0.01;
  }

  public getMinNodeWidth(): number {
    return 360;
  }

  public getMinNodeHeight(): number {
    return 100;
  }

  public getDefaultNodeWidth(): number {
    return 640;
  }

  public getDefaultNodeHeight(): number {
    return 240;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(ParentComponent, {
        nodeHeight: this.nodeHeight,
      });
      super.onNodeAdded();
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
