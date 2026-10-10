export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  const separator = ",";
  const keys = Object.keys(data[0]);

  const csvContent = [
    keys.join(separator),
    ...data.map((row) => {
      return keys
        .map((k) => {
          let cell = row[k] === null || row[k] === undefined ? "" : row[k];
          cell = String(cell).replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(separator);
    }),
  ].join("\n");

  const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
