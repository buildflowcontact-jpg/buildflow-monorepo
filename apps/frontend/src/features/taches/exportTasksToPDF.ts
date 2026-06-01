type PdfTask = {
  code: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
};

export async function exportTasksToPDF(tasks: PdfTask[], filename = 'taches.pdf') {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const columns = [
    { header: 'Code', dataKey: 'code' },
    { header: 'Titre', dataKey: 'title' },
    { header: 'Responsable', dataKey: 'assignee' },
    { header: 'Statut', dataKey: 'status' },
    { header: 'Priorité', dataKey: 'priority' },
    { header: 'Échéance', dataKey: 'dueDate' },
  ];
  const rows = tasks.map((task) => ({
    code: task.code,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  }));
  autoTable(doc, { columns, body: rows });
  doc.save(filename);
}
