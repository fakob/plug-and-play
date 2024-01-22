/**
 * author: akunzeng
 * 20170705
 */
// udpated by jakob

import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, ThemeProvider, styled } from '@mui/material';
import isUrl from 'is-url';
import ErrorFallback from './ErrorFallback';
import { customTheme } from '../utils/constants';
import { parseJSON } from '../utils/utils';
import './JsonPathPicker-style.css';

function parsePath(path: string): string[] {
  return path.split('.');
}

export interface P {
  json: string;
  onChoose(path: string): any;
  path: string | null;
  randomMainColor: string;
}

const MyValueSpan = styled('span')(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
  fontFamily: 'Roboto Mono, sans-serif',
  fontSize: '13px',
}));

const MyValueLinkSpan = styled('a')(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
  fontFamily: 'Roboto Mono, sans-serif',
  fontSize: '13px',
}));

const MyKeySpan = styled('span')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  fontFamily: 'Roboto Mono, sans-serif',
  fontSize: '13px',
}));

const MySeparatorSpan = styled('span')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  opacity: 0.5,
  fontFamily: 'Roboto Mono, sans-serif',
  fontSize: '13px',
}));

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
        choosenPath = tmp.join('.');
      } else {
        choosenPath = pathKey;
      }
      this.props.onChoose && this.props.onChoose(choosenPath);
    }
  };

  render() {
    let parsedJSON: any;
    try {
      parsedJSON = parseJSON(this.props.json).value;
    } catch (error) {
      console.warn(error);
      return (
        <Box sx={{ p: 1, color: 'white' }}>
          Input seems to not be a correct JSON format.
        </Box>
      );
    }
    return (
      <ThemeProvider theme={customTheme}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Box onClick={this.choose}>
            {json2Jsx(this.props.path, parsedJSON)}
          </Box>
        </ErrorBoundary>
      </ThemeProvider>
    );
  }
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
  pathKey = '',
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
  pathKey: string,
): React.ReactElement<any> {
  return (
    <MyValueSpan
      data-pathkey={pathKey}
      className={`json-literal json-value ${getPickerStyle(
        getRelationship(choosenPath, pathKey),
      )}`}
    >
      {'null'}
      <MySeparatorSpan>{isLast ? '' : ','}</MySeparatorSpan>
    </MyValueSpan>
  );
}

function renderUndefined(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
): React.ReactElement<any> {
  return (
    <MyValueSpan
      data-pathkey={pathKey}
      className={`json-literal json-value ${getPickerStyle(
        getRelationship(choosenPath, pathKey),
      )}`}
    >
      {'undefined'}
      <MySeparatorSpan>{isLast ? '' : ','}</MySeparatorSpan>
    </MyValueSpan>
  );
}

function renderString(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  str: string,
): React.ReactElement<any> {
  str = escape(str);
  if (isUrl(str)) {
    return (
      <MyValueLinkSpan
        data-pathkey={pathKey}
        className={`json-literal json-value ${getPickerStyle(
          getRelationship(choosenPath, pathKey),
        )}`}
        target="_blank"
        href={str}
      >
        <MySeparatorSpan>"</MySeparatorSpan>
        {str}
        <MySeparatorSpan>{isLast ? '"' : '",'}</MySeparatorSpan>
      </MyValueLinkSpan>
    );
  } else {
    return (
      <MyValueSpan
        data-pathkey={pathKey}
        className={`json-literal json-value ${getPickerStyle(
          getRelationship(choosenPath, pathKey),
        )}`}
      >
        <MySeparatorSpan>"</MySeparatorSpan>
        {str}
        <MySeparatorSpan>{isLast ? '"' : '",'}</MySeparatorSpan>
      </MyValueSpan>
    );
  }
}

function renderNumber(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  num: number,
): React.ReactElement<any> {
  return (
    <MyValueSpan
      data-pathkey={pathKey}
      className={`json-literal json-value ${getPickerStyle(
        getRelationship(choosenPath, pathKey),
      )}`}
    >
      {num}
      <MySeparatorSpan>{isLast ? '' : ','}</MySeparatorSpan>
    </MyValueSpan>
  );
}

function renderBoolean(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  bool: boolean,
): React.ReactElement<any> {
  return (
    <MyValueSpan
      data-pathkey={pathKey}
      className={`json-literal json-value ${getPickerStyle(
        getRelationship(choosenPath, pathKey),
      )}`}
    >
      {bool}
      <MySeparatorSpan>{isLast ? '' : ','}</MySeparatorSpan>
    </MyValueSpan>
  );
}

function renderObject(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  obj: any,
): React.ReactElement<any> {
  const relation = getRelationship(choosenPath, pathKey);

  const keys = Object.keys(obj);
  const length = keys.length;
  if (length > 0) {
    return (
      <div className={relation == 1 ? 'json-picked_tree' : ''}>
        <div>
          <MySeparatorSpan
            data-pathkey={pathKey}
            className={getPickerStyle(relation)}
          >
            {'{'}
          </MySeparatorSpan>
        </div>
        <ul className="json-dict">
          {keys.map((key, idx) => {
            const nextPathKey = pathKey === '' ? `${key}` : `${pathKey}.${key}`;
            return (
              <li
                key={nextPathKey}
                data-pathkey={nextPathKey}
                className={'listItem'}
              >
                <MyKeySpan
                  data-pathkey={nextPathKey}
                  className={`json-literal json-key ${getPickerStyle(
                    getRelationship(choosenPath, nextPathKey),
                  )}`}
                >
                  {key}
                </MyKeySpan>
                <MySeparatorSpan>:</MySeparatorSpan>
                {json2Jsx(
                  choosenPath,
                  obj[key],
                  idx == length - 1 ? true : false,
                  nextPathKey,
                )}
              </li>
            );
          })}
        </ul>
        <div>
          <MySeparatorSpan
            data-pathkey={pathKey}
            className={getPickerStyle(relation)}
          >
            {isLast ? '}' : '},'}
          </MySeparatorSpan>
        </div>
      </div>
    );
  } else {
    return (
      <MyKeySpan
        data-pathkey={pathKey}
        className={`json-literal json-key ${getPickerStyle(relation)}`}
      >
        {isLast ? '{ }' : '{ },'}
      </MyKeySpan>
    );
  }
}

function renderArray(
  choosenPath: string,
  isLast: boolean,
  pathKey: string,
  arr: any[],
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
              [*]
            </i>
          ) : null}
          <MySeparatorSpan
            data-pathkey={pathKey}
            className={getPickerStyle(relation)}
          >
            {'['}
          </MySeparatorSpan>
        </div>
        <ol className="json-array">
          {arr.map((value, idx) => {
            const nextPathKey =
              pathKey === '' ? `${idx}` : `${pathKey}.[${idx}]`;
            return (
              <li key={nextPathKey}>
                {json2Jsx(
                  choosenPath,
                  value,
                  idx == length - 1 ? true : false,
                  nextPathKey,
                )}
              </li>
            );
          })}
        </ol>
        <div>
          <MySeparatorSpan
            data-pathkey={pathKey}
            className={getPickerStyle(relation)}
          >
            {isLast ? ']' : '],'}
          </MySeparatorSpan>
        </div>
      </div>
    );
  } else {
    return (
      <MyKeySpan
        data-pathkey={pathKey}
        className={`json-literal json-key ${getPickerStyle(relation)}`}
      >
        {isLast ? '[ ]' : '[ ],'}
      </MyKeySpan>
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
