// بيانات الاتصال بقاعدة Supabase
const supabaseUrl = 'https://fbxphgrumfifpanlkbzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieHBoZ3J1bWZpZnBhbmxrYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg1NTQsImV4cCI6MjA2MTQxNDU1NH0.gaS2hTxSTniuedtKxTStMKC4e-72Y554aYTYGKEBoDE';
const tableName = "pathology_report"; // لاحظ أن الجدول هو pathology_report
const bucketName = "photo";

// جلب الكود من الرابط
const params = new URLSearchParams(window.location.search);
const patientCode = params.get("code");

// تحميل بيانات المريض
async function loadPatient() {
  const { data, error } = await fetchPatientByCode(patientCode);

  if (error) {
    console.error(error);
    alert("حدث خطأ أثناء تحميل البيانات.");
    return;
  }

  if (!data || data.length === 0) {
    alert("لا توجد بيانات للمريض.");
    return;
  }

  fillPatientData(data[0]);
}

// جلب بيانات المريض حسب الكود
async function fetchPatientByCode(code) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?code=eq.${code}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  const data = await response.json();
  return { data };
}

// تعبئة الحقول ببيانات المريض
function fillPatientData(patient) {
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerText = value || "";
    }
  };

  setText("patient_name", patient.patient_name);
  setText("age", patient.age);
  setText("sex", patient.sex);
  setText("specimen_received_date", patient.specimen_received_date);
  setText("date_report_issued", patient.report_issued_date); // انتبه هنا
  setText("referred_by", patient.referred_by);
  setText("code_by", patient.code);
  setText("clinical_diagnosis", patient.clinical_data); // ربط clinical_data
  setText("specimen_type", patient.specimen_information); // ربط specimen_information
  setText("gross_picture", patient.gross_picture);
  setText("microscopic_picture", patient.microscopic_picture);
  setText("diagnosis", patient.diagnosis);
  setText("doctor_signature", patient.doctor_signature);
}


// وظيفة طباعة التقرير
function printReport() {
  const reportContent = document.getElementById('patientReport').innerHTML;

  const printWindow = window.open('', '_blank', 'width=800,height=800');
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة تقرير المريض</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          margin: 20px;
          color: #333;
        }
        .report-container {
          width: 100%;
          margin: auto;
        }
        .barcode-signature-container {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        #barcode {
          width: 100px;
          height: 40px;
        }
        .signature {
          font-size: 12px;
          font-weight: bold;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        ${reportContent}

        <div class="barcode-signature-container">
          <svg id="barcode"></svg>
          <div class="signature">
            ${document.getElementById("doctor_signature").innerText}
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        window.onload = function() {
          JsBarcode("#barcode", "${window.location.href}", {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 50,
            displayValue: false
          });
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// تحميل الصور الإضافية (اختياري)
async function loadVisualPhotos() {
  const photosSection = document.getElementById("photosSection");
  photosSection.innerHTML = "";

  const { data, error } = await listPhotos(patientCode);

  if (error || !data || data.length === 0) {
    photosSection.innerHTML = "<p>لا توجد صور إضافية.</p>";
    return;
  }

  data.forEach(photo => {
    const img = document.createElement("img");
    img.src = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${patientCode}/${photo.name}`;
    photosSection.appendChild(img);
  });
}

// جلب الصور الإضافية
async function listPhotos(folder) {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('Error loading photos:', error.message);
    return { error: true };
  }
  
  return { data };
}

// توليد كود QR وحفظه
function generateAndDownloadQR() {
  const reportUrl = window.location.href;

  const qr = new QRious({
    value: reportUrl,
    size: 300,
    level: 'H',
  });

  const link = document.createElement('a');
  link.href = qr.toDataURL('image/png');
  link.download = 'report-qr-code.png';
  link.click();
}



// تحميل صفحة المريض عند بدء الصفحة
loadPatient();
