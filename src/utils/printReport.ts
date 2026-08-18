interface PrintColumn {
  header: string;
  key: string;
}

interface PrintSection {
  title: string;
  data: Record<string, unknown>[];
  columns: PrintColumn[];
}

export function printReport(
  title: string,
  sections: PrintSection[],
  subtitle?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionsHtml = sections
    .map(
      (section) => `
      <div class="section">
        <h2>${section.title}</h2>
        <table>
          <thead>
            <tr>
              ${section.columns.map((col) => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${
              section.data.length > 0
                ? section.data
                    .map(
                      (row) => `
                  <tr>
                    ${section.columns
                      .map((col) => `<td>${row[col.key] || '—'}</td>`)
                      .join('')}
                  </tr>
                `
                    )
                    .join('')
                : `<tr><td colspan="${section.columns.length}" class="empty">لا توجد بيانات</td></tr>`
            }
          </tbody>
        </table>
        <p class="count">الإجمالي: ${section.data.length}</p>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          padding: 20px;
          color: #1a1919;
          background: #fff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #612e37;
        }
        
        .header h1 {
          color: #612e37;
          font-size: 28px;
          margin-bottom: 8px;
        }
        
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .header .date {
          color: #888;
          font-size: 12px;
          margin-top: 8px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          color: #333;
          font-size: 18px;
          margin-bottom: 12px;
          padding-right: 10px;
          border-right: 4px solid #612e37;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 10px 12px;
          text-align: right;
        }
        
        th {
          background: #f8f8f8;
          font-weight: 600;
          color: #333;
        }
        
        tr:nth-child(even) {
          background: #fafafa;
        }
        
        .count {
          text-align: left;
          color: #666;
          font-size: 12px;
        }
        
        .empty {
          text-align: center;
          color: #999;
          padding: 20px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 11px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        <p class="date">${currentDate}</p>
      </div>
      
      ${sectionsHtml}
      
      <div class="footer">
        تم إنشاء هذا التقرير بواسطة نظام Pink Cake
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for fonts to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}
