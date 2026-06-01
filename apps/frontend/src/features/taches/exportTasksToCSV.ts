type CsvTask = {
  code: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
};

export async function exportTasksToCSV(tasks: CsvTask[], filename = 'taches.csv') {
  const { unparse } = await import('papaparse');
  const csv = unparse(tasks);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
