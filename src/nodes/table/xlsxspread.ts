import * as XLSX from 'xlsx/xlsx.mjs';

/**
 * Converts data from SheetJS to x-spreadsheet
 *
 * @param  {Object} wb SheetJS workbook object
 *
 * @returns {Object[]} An x-spreadsheet data
 */
export function stox(wb: XLSX.workbook): unknown {
  const out = [];
  wb.SheetNames.forEach(function (name) {
    const o = { name: name, rows: {}, merges: [] };
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws['!ref']);
    // sheet_to_json will lost empty row and col at begin as default
    range.s = { r: 0, c: 0 };
    const aoa = XLSX.utils.sheet_to_json(ws, {
      raw: false,
      header: 1,
      range: range,
    });

    aoa.forEach(function (r, i) {
      const cells = {};
      r.forEach(function (c, j) {
        cells[j] = { text: c };

        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });

        if (ws[cellRef] != null && ws[cellRef].f != null) {
          cells[j].text = '=' + ws[cellRef].f;
        }
      });
      o.rows[i] = { cells: cells };
    });

    o.merges = [];
    (ws['!merges'] || []).forEach(function (merge, i) {
      //Needed to support merged cells with empty content
      if (o.rows[merge.s.r] == null) {
        o.rows[merge.s.r] = { cells: {} };
      }
      if (o.rows[merge.s.r].cells[merge.s.c] == null) {
        o.rows[merge.s.r].cells[merge.s.c] = {};
      }

      o.rows[merge.s.r].cells[merge.s.c].merge = [
        merge.e.r - merge.s.r,
        merge.e.c - merge.s.c,
      ];

      o.merges[i] = XLSX.utils.encode_range(merge);
    });

    out.push(o);
  });

  return out;
}

/**
 * Converts data from x-spreadsheet to SheetJS
 *
 * @param  {Object[]} sdata An x-spreadsheet data object
 *
 * @returns {Object} A SheetJS workbook object
 */
export function xtos(sdata: any): XLSX.WorkBook {
  const out = XLSX.utils.book_new();
  sdata.forEach(function (xws) {
    const ws = {};
    const rowobj = xws.rows;
    let minCoord, maxCoord;
    for (let ri = 0; ri < rowobj.len; ++ri) {
      const row = rowobj[ri];
      if (!row) continue;

      Object.keys(row.cells).forEach(function (k) {
        const idx = +k;
        if (isNaN(idx)) return;

        const lastRef = XLSX.utils.encode_cell({ r: ri, c: idx });
        if (minCoord == null) {
          minCoord = { r: ri, c: idx };
        } else {
          if (ri < minCoord.r) minCoord.r = ri;
          if (idx < minCoord.c) minCoord.c = idx;
        }
        if (maxCoord == undefined) {
          maxCoord = { r: ri, c: idx };
        } else {
          if (ri > maxCoord.r) maxCoord.r = ri;
          if (idx > maxCoord.c) maxCoord.c = idx;
        }

        let cellText = row.cells[k].text;
        let type = 's';
        if (!cellText) {
          cellText = '';
          type = 'z';
        } else if (!isNaN(Number(cellText))) {
          cellText = Number(cellText);
          type = 'n';
        } else if (
          cellText.toLowerCase() === 'true' ||
          cellText.toLowerCase() === 'false'
        ) {
          cellText = Boolean(cellText);
          type = 'b';
        }

        ws[lastRef] = { v: cellText, t: type };

        if (type == 's' && cellText[0] == '=') {
          ws[lastRef].f = cellText.slice(1);
        }

        if (row.cells[k].merge != null) {
          if (ws['!merges'] == null) ws['!merges'] = [];

          ws['!merges'].push({
            s: { r: ri, c: idx },
            e: {
              r: ri + row.cells[k].merge[0],
              c: idx + row.cells[k].merge[1],
            },
          });
        }
      });
    }
    if (minCoord) {
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: minCoord.r, c: minCoord.c },
        e: { r: maxCoord.r, c: maxCoord.c },
      });
    }

    XLSX.utils.book_append_sheet(out, ws, xws.name);
  });

  return out;
}
