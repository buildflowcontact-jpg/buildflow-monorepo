type SubTask = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
};

type PdfTask = {
  code: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
  subTasks?: SubTask[];
};

type PdfRow = {
  type: string;
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

  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Liste des taches et sous-taches', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exporte le ${new Date().toLocaleDateString('fr-FR')}`, 14, 20);

  const columns = [
    { header: 'Type', dataKey: 'type' },
    { header: 'Code', dataKey: 'code' },
    { header: 'Titre', dataKey: 'title' },
    { header: 'Responsable', dataKey: 'assignee' },
    { header: 'Statut', dataKey: 'status' },
    { header: 'Priorite', dataKey: 'priority' },
    { header: 'Echeance', dataKey: 'dueDate' },
  ];

  const rows: PdfRow[] = [];
  for (const task of tasks) {
    rows.push({
      type: 'Tache',
      code: task.code,
      title: task.title,
      assignee: task.assignee,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    for (const sub of task.subTasks ?? []) {
      rows.push({
        type: 'Sous-tache',
        code: sub.code,
        title: `    ${sub.title}`,
        assignee: sub.assignee,
        status: sub.status,
        priority: sub.priority,
        dueDate: sub.dueDate,
      });
    }
  }

  autoTable(doc, {
    columns,
    body: rows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.row.raw as PdfRow).type === 'Sous-tache') {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [71, 85, 105];
        data.cell.styles.fontSize = 7.5;
      }
    },
  });

  doc.save(filename);
}
