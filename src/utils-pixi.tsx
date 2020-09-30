import { GridPosition } from './interfaces';

export const getGridPosition = (
  columnCount: number,
  width: number,
  height: number,
  margin: number,
  index: number
): {
  x: number;
  y: number;
  scale: number;
} => {
  const x = (index % columnCount) * (width + width * margin);
  const y = Math.floor(index / columnCount) * (height + width * margin);
  return {
    x,
    y,
    scale: 1,
  };
};

export const getGridPositionArray = (
  columnCount: number,
  width: number,
  height: number,
  amount: number,
  marginSize: number
): Array<GridPosition> => {
  const margin = marginSize / 500;
  const gridPositionArray: Array<GridPosition> = [];
  for (let index = 0; index < amount; index += 1) {
    gridPositionArray.push(
      getGridPosition(columnCount, width, height, margin, index)
    );
  }
  // console.log(gridPositionArray);
  return gridPositionArray;
};

export const getMoviePrintHeight = (
  columnCount: number,
  moviePrintWidth: number,
  width: number,
  height: number,
  amount: number,
  marginSize: number
): number => {
  const margin = marginSize / 100;
  const scaledWidth = moviePrintWidth / ((1 + margin) * columnCount);
  const scale = scaledWidth / width;
  const scaledHeight = height * scale;
  const rowCount = Math.ceil(amount / columnCount);
  const moviePrintHeight =
    (scaledWidth * margin) / 4 +
    rowCount * (scaledHeight + scaledWidth * margin);
  return Math.ceil(moviePrintHeight);
};
