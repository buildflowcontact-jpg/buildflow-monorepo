function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? '');
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csvContent = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  triggerDownload(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function downloadExcel(filename: string, worksheetName: string, rows: Array<Array<string | number>>) {
  const bodyRows = rows
    .map((row, rowIndex) => {
      const tag = rowIndex === 0 ? 'th' : 'td';
      const cells = row.map((cell) => `<${tag}>${String(cell ?? '')}</${tag}>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <meta name="ProgId" content="Excel.Sheet" />
        <meta name="Generator" content="BuildFlow" />
        <title>${worksheetName}</title>
      </head>
      <body>
        <table>
          ${bodyRows}
        </table>
      </body>
    </html>
  `;

  triggerDownload(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), filename);
}

export function openPrintPreview(title: string, sections: Array<{ label: string; value: string }>) {
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!popup) {
    throw new Error('Impossible d ouvrir la fenetre d impression.');
  }

  const generatedAt = new Date().toLocaleString();
  const blocks = sections
    .map(
      (section) => `
        <div class="card">
          <div class="label">${section.label}</div>
          <div class="value">${section.value}</div>
        </div>
      `,
    )
    .join('');

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 0 0 24px; color: #475569; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          .card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; }
          .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; }
          .value { margin-top: 8px; font-size: 22px; font-weight: 800; color: #0f172a; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Genere le ${generatedAt}</p>
        <div class="grid">${blocks}</div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}