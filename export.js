const tables = {
    immunohistochemistry: {
      url: "https://bnmgxpkqjhhhccaroibc.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs",
      table: "immunohistochemistry_report",
    },
    pathology: {
      url: "https://fbxphgrumfifpanlkbzd.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieHBoZ3J1bWZpZnBhbmxrYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg1NTQsImV4cCI6MjA2MTQxNDU1NH0.gaS2hTxSTniuedtKxTStMKC4e-72Y554aYTYGKEBoDE",
      table: "pathology_report",
    },
    cytology: {
      url: "https://bimyioebtynlhxqzwqge.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbXlpb2VidHlubGh4cXp3cWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg2OTAsImV4cCI6MjA2MTQxNDY5MH0.dDvpl3X5H4hQ9BSFXEdg_eV0NJVF7K8FcNJ-R5-HEcw",
      table: "cytology_reports",
    }
  };
   
  async function exportTable(type) {
  const { url, key, table } = tables[type];

  const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const patients = await response.json();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Patients');

  // إعداد الأعمدة
  const columns = Object.keys(patients[0] || {}).filter(k => k !== "photo_url");
  worksheet.columns = [{ header: 'الصورة', key: 'image', width: 20 }, ...columns.map(k => ({
    header: k,
    key: k,
    width: 20
  }))];

  // إضافة صفوف وصور
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const row = worksheet.addRow(patient);

    // إذا وُجدت صورة
    if (patient.photo_url) {
      const imageUrl = `${url}/storage/v1/object/public/photo/${patient.photo_url}`;
      try {
        const base64 = await getImageBase64(imageUrl);
        const imageId = workbook.addImage({
          base64,
          extension: 'jpeg'
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: i + 1 },
          ext: { width: 100, height: 100 }
        });
      } catch (err) {
        console.error("فشل تحميل الصورة", err);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${table}.xlsx`);
}

// تحويل الصورة إلى Base64
async function getImageBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // فقط الـ base64 بدون البيانات الوصفية
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}