const supabaseUrl = 'https://fbxphgrumfifpanlkbzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieHBoZ3J1bWZpZnBhbmxrYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg1NTQsImV4cCI6MjA2MTQxNDU1NH0.gaS2hTxSTniuedtKxTStMKC4e-72Y554aYTYGKEBoDE';
const tableName = "pathology_report";
const bucketName = "photo";

const searchInput = document.getElementById("searchInput");
const patientsList = document.getElementById("patientsList");

// ✅ دالة تنظيف النصوص (همزات + تشكيل + مسافات)
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '');
}

// ✅ البحث الذكي
async function searchPatients() {
  const inputRaw = searchInput.value.trim();
  const inputNormalized = normalizeText(inputRaw);

  if (inputNormalized.length === 0) {
    patientsList.innerHTML = "";
    return;
  }

  const { data, error } = await fetchPatientsByName(inputRaw);

  if (error) {
    console.error(error);
    return;
  }

  // ✅ ترتيب حسب البداية أو الاحتواء
  const sorted = data.sort((a, b) => {
    const nameA = normalizeText(a.patient_name);
    const nameB = normalizeText(b.patient_name);
    const startsWithA = nameA.startsWith(inputNormalized);
    const startsWithB = nameB.startsWith(inputNormalized);

    if (startsWithA && !startsWithB) return -1;
    if (!startsWithA && startsWithB) return 1;
    return nameA.localeCompare(nameB);
  });

  renderPatients(sorted);
}

// ✅ جلب البيانات من Supabase
async function fetchPatientsByName(name) {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  const encoded = encodeURIComponent(`%${cleaned}%`);
  const query = `patient_name=ilike.${encoded}`;

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact"
    },
  });

  const data = await response.json();
  return { data };
}

// ✅ عرض النتائج
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
        <button onclick="deletePatient('${patient.code}', '${patient.photo_url}')"
          style="background-color: red; margin-right: 5px;">حذف</button>
      </div>
    `;

    patientsList.appendChild(card);
  });
}

// ✅ رابط الصورة
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

// ✅ فتح صفحة المريض
function openPatient(code) {
  window.location.href = `patient2.html?code=${code}`;
}

// ✅ حذف مريض بالكامل
async function deletePatient(code, photoPath) {
  if (!confirm("هل أنت متأكد أنك تريد حذف هذا المريض؟")) return;

  try {
    if (photoPath) await deleteFromStorage(photoPath);
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

// ✅ حذف صورة من التخزين
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

// ✅ حذف مجلد صور كامل
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
