const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs'; // استخدم مفتاح الـ API الخاص بك
const tableName = "immunohistochemistry_report";
const bucketName = "photo";

const params = new URLSearchParams(window.location.search);
const patientCode = params.get("code");

const fields = [
  "patient_name",
  "age",
  "sex",
  "specimen_received_date",
  "date_report_issued",
  "referred_by",
  "clinical_data",
  "specimen",
  "procedure",
  "results",
  "diagnosis",
  "code",
];

async function loadPatient() {
  const { data, error } = await fetchPatientByCode(patientCode);

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    alert("لا توجد بيانات للمريض.");
    return;
  }

  fillPatientData(data[0]);
}

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

function fillPatientData(patient) {
  document.getElementById("patient_name").innerText = patient.patient_name || "";
  document.getElementById("age").innerText = patient.age || "";
  document.getElementById("sex").innerText = patient.sex || "";
  document.getElementById("specimen_received_date").innerText = patient.specimen_received_date || "";
  document.getElementById("date_report_issued").innerText = patient.date_report_issued || "";
  document.getElementById("referred_by").innerText = patient.referred_by || "";
  document.getElementById("clinical_data").innerText = patient.clinical_data || "";
  document.getElementById("specimen").innerText = patient.specimen || "";
  document.getElementById("procedure").innerText = patient.procedure || "";
  
  document.getElementById("results").innerHTML = (patient.results || "")
    .split("\n").map(line => `<li>${line.trim()}</li>`).join("");

  document.getElementById("diagnosis").innerHTML = (patient.diagnosis || "")
    .split("\n").map(line => `<li>${line.trim()}</li>`).join("");

  document.getElementById("code").innerText = patient.code || "";
}

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
        ul {
          padding-right: 20px;
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
            PROF - DR HAYAM RASHED
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

 


function saveAsImage() {
  import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js').then(() => {
    const patientReport = document.getElementById("patientReport");
    html2canvas(patientReport).then(canvas => {
      const link = document.createElement("a");
      link.download = "patient-report.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });
}

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


loadPatient();
function generateAndDownloadQR() {
  const reportUrl = window.location.href;

  const qr = new QRious({
    value: reportUrl,
    size: 300, // حجم ممتاز للقراءة
    level: 'H', // أعلى تصحيح خطأ
  });

  const link = document.createElement('a');
  link.href = qr.toDataURL('image/png');
  link.download = 'report-qr-code.png';
  link.click();
}

