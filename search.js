const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs';
const tableName = "immunohistochemistry_report";
const bucketName = "photo";

const searchInput = document.getElementById("searchInput");
const patientsList = document.getElementById("patientsList");

async function searchPatients() {
  const searchTerm = searchInput.value.trim();

  if (searchTerm.length === 0) {
    patientsList.innerHTML = "";
    return;
  }

  const { data, error } = await fetchPatientsByName(searchTerm);

  if (error) {
    console.error(error);
    return;
  }

  renderPatients(data);
}

// ✅ البحث يبدأ بنفس الحرف فقط (غير حساس لحالة الحروف)
async function fetchPatientsByName(name) {
  const lowercase = name.toLowerCase();
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const query = `or=(patient_name.ilike.${lowercase}*,patient_name.ilike.${capitalized}*)`;

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Range: "0-999",
      "Range-Unit": "items"
    },
  });

  const data = await response.json();
  return { data };
}


 
function renderPatients(patients) {
  patientsList.innerHTML = "";

  if (patients.length === 0) {
    patientsList.innerHTML = "<p>لا توجد نتائج.</p>";
    return;
  }

  patients.forEach(async (patient) => {
    const card = document.createElement("div");
    card.className = "patient-card";

    let photoUrl = "default-avatar.png";
    if (patient.photo_url) {
      const { signedUrl } = await getSignedUrl(patient.photo_url);
      photoUrl = signedUrl || "default-avatar.png";
    }

    card.innerHTML = `
      <img src="${photoUrl}" alt="صورة المريض">
      <div class="patient-info">
        <h3>${patient.patient_name}</h3>
      </div>
      <div class="patient-actions">
        <button onclick="openPatient('${patient.code}')">عرض الملف</button>
        <button onclick="deletePatient('${patient.code}', '${patient.photo_url}')" style="background-color: red; margin-right: 5px;">حذف</button>
      </div>
    `;

    patientsList.appendChild(card);
  });
}

async function getSignedUrl(path) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/${bucketName}/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  });

  if (response.ok) {
    return { signedUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}` };
  }
  return {};
}

function openPatient(code) {
  window.location.href = `patient.html?code=${code}`;
}

async function deletePatient(code, photoPath) {
  if (!confirm("هل أنت متأكد أنك تريد حذف هذا المريض؟")) {
    return;
  }

  try {
    if (photoPath) {
      await deleteFromStorage(photoPath);
    }

    await deleteFolder(code);

    const { error } = await fetch(`${supabaseUrl}/rest/v1/${tableName}?code=eq.${code}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (error) {
      console.error(error);
      alert('❌ حدث خطأ أثناء حذف المريض.');
    } else {
      alert('✅ تم حذف المريض بنجاح.');
      searchPatients();
    }

  } catch (error) {
    console.error(error);
    alert('❌ حدث خطأ أثناء حذف المريض.');
  }
}

async function deleteFromStorage(filePath) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`, {
    method: "DELETE",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  return response.ok;
}

async function deleteFolder(code) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketName}?prefix=${code}/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) return;

  const files = await response.json();

  for (const file of files) {
    await deleteFromStorage(file.name);
  }
}
