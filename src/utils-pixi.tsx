import { GridPosition } from './interfaces';

export const rgbToHex = (rgbArray: number[]): string => {
  return rgbArray
    .slice(0, 3)
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

export const hexToRGB = (hex: string, alpha: string): number[] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return [r, g, b, parseFloat(alpha)];
  } else {
    return [r, g, b];
  }
};

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
