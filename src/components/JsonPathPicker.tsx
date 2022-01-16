/**
 * author: akunzeng
 * 20170705
 */

import * as React from 'react';
import './JsonPathPicker-style.css';

const pathR = /(\.".+?")|(\[.+?\])/g;
function parsePath(path: string): string[] {
  return path.match(pathR) || [];
}

export interface P {
  json: string; // json string
  onChoose(path: string): any;
  path: string | null;
}

export class JsonPathPicker extends React.PureComponent<P, unknown> {
  constructor(props: P) {
    super(props);
  }
  choose = (e: any) => {
    const target = e.target;
    if (target.hasAttribute('data-pathkey')) {
      const pathKey = target.getAttribute('data-pathkey');
      let choosenPath;

      if (target.hasAttribute('data-choosearr')) {
        const tmp = parsePath(this.props.path);
        const idx = parsePath(pathKey).length;
        tmp[idx] = '[*]';
        choosenPath = tmp.join('');
      } else {
        choosenPath = pathKey;
      }

      this.props.onChoose && this.props.onChoose(choosenPath);
    }
  };

  render() {
    let jsonObj: any;
    try {
      console.log(this.props.json);
      switch (typeof this.props.json) {
        case 'string':
          jsonObj = JSON.parse(this.props.json);
          break;
        case 'object':
          jsonObj = this.props.json;
          break;

        default:
          jsonObj = {};
          break;
      }
    } catch (error) {
      console.log(error);
      return <div>Wrong json string input</div>;
    }
    return (
      <div onClick={this.choose}>{json2Jsx(this.props.path, jsonObj)}</div>
    );
  }
}

/**
 * Check if a string represents a valid url
 * @return boolean
 */
function isUrl(str: string): boolean {
  const regexp =
    /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(str);
}

function escape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

//TODO: ReactElement -> PureComponent, to prevent rerendering uncorrelated object/arrays when path changes
/**
 * recursively generate jsxs by json data
 * @param choosenPath
 * @param jsonObj
 * @param isLast :is the last child or not
 * @param pathKey :now json path from root
 * @return reactElements
 */
function json2Jsx(
  choosenPath: string,
  jsonObj: any,
  isLast = true,
  pathKey = ''
): React.ReactElement<any> {
  if (jsonObj === null) {
    return renderNull(choosenPath, isLast, pathKey);
  } else if (jsonObj === undefined) {
    return renderUndefined(choosenPath, isLast, pathKey);
  } else if (Array.isArray(jsonObj)) {
    return renderArray(choosenPath, isLast, pathKey, jsonObj);
  } else if (typeof jsonObj == 'string') {
    return renderString(choosenPath, isLast, pathKey, jsonObj);
  } else if (typeof jsonObj == 'number') {
    return renderNumber(choosenPath, isLast, pathKey, jsonObj);
  } else if (typeof jsonObj == 'boolean') {
    return renderBoolean(choosenPath, isLast, pathKey, jsonObj);
  } else if (typeof jsonObj == 'object') {
    return renderObject(choosenPath, isLast, pathKey, jsonObj);
  } else {
    return null;
  }
}

// various types' render
function renderNull(
  choosenPath: string,
  isLast: boolean,
  pathKey: string
): React.ReactElement<any> {
  return (
    <span className="json-literal">
      <i
        data-pathkey={pathKey}
        className={getPickerStyle(getRelationship(choosenPath, pathKey))}
      >
        █
      </i>
      <span>
        {'null'} {isLast ? '' : ','}
      </span>
    </span>
  );
}

function renderUndefined(
  choosenPath: string,
  isLast: boolean,
  pathKey: string
): React.ReactElement<any> {
  return (
    <span className="json-literal">
      <i
        data-pathkey={pathKey}
        className={getPickerStyle(getRelationship(choosenPath, pathKey))}
      >
        █
      </i>
      <span>
        {'undefined'} {isLast ? '' : ','}
      </span>
    </span>
  );
}

function renderString(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  str: string
): React.ReactElement<any> {
  str = escape(str);
  if (isUrl(str)) {
    return (
      <span>
        <i
          data-pathkey={pathKey}
          className={getPickerStyle(getRelationship(choosenPath, pathKey))}
        >
          █
        </i>
        <a target="_blank" href={str} className="json-literal">
          <span>
            "{str}" {isLast ? '' : ','}
          </span>
        </a>
      </span>
    );
  } else {
    return (
      <span className="json-literal">
        <i
          data-pathkey={pathKey}
          className={getPickerStyle(getRelationship(choosenPath, pathKey))}
        >
          █
        </i>
        <span>
          "{str}" {isLast ? '' : ','}
        </span>
      </span>
    );
  }
}

function renderNumber(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  num: number
): React.ReactElement<any> {
  return (
    <span className="json-literal">
      <i
        data-pathkey={pathKey}
        className={getPickerStyle(getRelationship(choosenPath, pathKey))}
      >
        █
      </i>
      <span>
        {num} {isLast ? '' : ','}
      </span>
    </span>
  );
}

function renderBoolean(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  bool: boolean
): React.ReactElement<any> {
  return (
    <span className="json-literal">
      <i
        data-pathkey={pathKey}
        className={getPickerStyle(getRelationship(choosenPath, pathKey))}
      >
        █
      </i>
      <span>
        {bool} {isLast ? '' : ','}
      </span>
    </span>
  );
}

function renderObject(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  obj: any
): React.ReactElement<any> {
  const relation = getRelationship(choosenPath, pathKey);

  const keys = Object.keys(obj);
  const length = keys.length;
  if (length > 0) {
    return (
      <div className={relation == 1 ? 'json-picked_tree' : ''}>
        <div>
          <span>{'{'}</span>
          <i data-pathkey={pathKey} className={getPickerStyle(relation)}>
            █
          </i>
        </div>
        <ul className="json-dict">
          {keys.map((key, idx) => {
            const nextPathKey = `${pathKey}["${key}"]`;
            return (
              <li key={nextPathKey}>
                <span className="json-literal json-key">{key}</span>
                <span> : </span>
                {json2Jsx(
                  choosenPath,
                  obj[key],
                  idx == length - 1 ? true : false,
                  nextPathKey
                )}
              </li>
            );
          })}
        </ul>
        <div>
          {'}'} {isLast ? '' : ','}
        </div>
      </div>
    );
  } else {
    return (
      <span>
        <i data-pathkey={pathKey} className={getPickerStyle(relation)}>
          █
        </i>
        <span>
          {'{ }'} {isLast ? '' : ','}
        </span>
      </span>
    );
  }
}

function renderArray(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  arr: any[]
): React.ReactElement<any> {
  const relation = getRelationship(choosenPath, pathKey);

  const length = arr.length;
  if (length > 0) {
    return (
      <div className={relation == 1 ? 'json-picked_tree' : ''}>
        <div>
          {relation == 2 ? (
            <i
              data-pathkey={pathKey}
              data-choosearr="1"
              className={getPickArrStyle(choosenPath, pathKey)}
            >
              [✚]
            </i>
          ) : null}
          <span>{'['}</span>
          <i data-pathkey={pathKey} className={getPickerStyle(relation)}>
            █
          </i>
        </div>
        <ol className="json-array">
          {arr.map((value, idx) => {
            const nextPathKey = `${pathKey}[${idx}]`;
            return (
              <li key={nextPathKey}>
                {json2Jsx(
                  choosenPath,
                  value,
                  idx == length - 1 ? true : false,
                  nextPathKey
                )}
              </li>
            );
          })}
        </ol>
        <div>
          {']'} {isLast ? '' : ','}
        </div>
      </div>
    );
  } else {
    return (
      <span>
        <i data-pathkey={pathKey} className={getPickerStyle(relation)}>
          █
        </i>
        <span>
          {'[ ]'} {isLast ? '' : ','}
        </span>
      </span>
    );
  }
}

/**
 * get the relationship between now path and the choosenPath
 * 0 other
 * 1 self
 * 2 ancestor
 */
function getRelationship(choosenPath: string, path: string): number {
  if (choosenPath === null) return 0;

  const choosenAttrs = parsePath(choosenPath);
  const choosenLen = choosenAttrs.length;

  const nowAttrs = parsePath(path);
  const nowLen = nowAttrs.length;

  if (nowLen > choosenLen) return 0;

  for (let i = 0; i < nowLen; i++) {
    let ok: boolean;

    if (nowAttrs[i] === choosenAttrs[i]) {
      ok = true;
    } else if (
      nowAttrs[i][0] === '[' &&
      choosenAttrs[i][0] === '[' &&
      choosenAttrs[i][1] === '*'
    ) {
      ok = true;
    } else {
      ok = false;
    }

    if (!ok) return 0;
  }

  return nowLen == choosenLen ? 1 : 2;
}

/**
 * get picker's className, for distinguishing picked or not or ancestor of picked entity
 */
function getPickerStyle(relation: number): string {
  if (relation == 0) {
    return 'json-pick_path';
  } else if (relation == 1) {
    return 'json-pick_path json-picked';
  } else {
    return 'json-pick_path json-pick_path_ancestor';
  }
}

function getPickArrStyle(choosenPath: string, nowPath: string): string {
  const csp = parsePath(choosenPath);
  const np = parsePath(nowPath);
  if (csp[np.length] == '[*]') {
    return 'json-pick_arr json-picked_arr';
  } else {
    return 'json-pick_arr';
  }
}
