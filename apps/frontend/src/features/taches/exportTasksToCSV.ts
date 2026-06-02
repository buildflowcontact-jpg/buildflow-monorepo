type SubTask = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
};

type CsvTask = {
  code: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
  subTasks?: SubTask[];
};

type CsvRow = {
  Type: string;
  Code: string;
  Titre: string;
  Responsable: string;
  Statut: string;
  Priorite: string;
  Echeance: string;
};

export async function exportTasksToCSV(tasks: CsvTask[], filename = 'taches.csv') {
  const { unparse } = await import('papaparse');

  const rows: CsvRow[] = [];
  for (const task of tasks) {
    rows.push({
      Type: 'Tache',
      Code: task.code,
      Titre: task.title,
      Responsable: task.assignee,
      Statut: task.status,
      Priorite: task.priority,
      Echeance: task.dueDate,
    });
    for (const sub of task.subTasks ?? []) {
      rows.push({
        Type: 'Sous-tache',
        Code: sub.code,
        Titre: `  ${sub.title}`,
        Responsable: sub.assignee,
        Statut: sub.status,
        Priorite: sub.priority,
        Echeance: sub.dueDate,
      });
    }
  }

  const csv = unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
