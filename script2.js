// ---------------------------
// يعمل مباشرة في المتصفح
// HTML يجب أن يحتوي أولاً:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js"></script>
// ثم:
// <script src="script2.js"></script>
// ---------------------------

// إنشاء عميل Supabase من الكائن العالمي الصحيح
const supabaseUrl = 'https://fbxphgrumfifpanlkbzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieHBoZ3J1bWZpZnBhbmxrYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg1NTQsImV4cCI6MjA2MTQxNDU1NH0.gaS2hTxSTniuedtKxTStMKC4e-72Y554aYTYGKEBoDE';

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// عناصر الصفحة
const form = document.getElementById('patientForm');
const statusDiv = document.getElementById('uploadStatus');

// ---------------------------
// توليد الكود التالي تلقائياً
async function generateNextCode() {
  const { data, error } = await supabaseClient
    .from('pathology_report')
    .select('code')
    .order('id', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return 'D1';

  const lastCode = data[0].code;
  const letter = lastCode.match(/[A-Z]/)[0];
  const number = parseInt(lastCode.match(/\d+/)[0], 10) + 1;
  return `${letter}${number}`;
}

// ---------------------------
// تهيئة الكود
async function initializeCode() {
  let codeInput = document.getElementById('code');
  if (!codeInput) {
    codeInput = document.createElement('input');
    codeInput.type = 'hidden';
    codeInput.id = 'code';
    form.appendChild(codeInput);
  }
  codeInput.value = await generateNextCode();
}

document.addEventListener('DOMContentLoaded', initializeCode);

// ---------------------------
// عند إرسال النموذج
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const code = document.getElementById('code').value.trim();
  const photoFile = document.getElementById('photo').files[0];
  const additionalPhotos = document.getElementById('additionalPhotos').files;

  if (!code || !photoFile) {
    statusDiv.textContent = '❌ يرجى إدخال الكود واختيار صورة الهوية';
    return;
  }

  // رفع صورة الهوية
  const ext = photoFile.name.split('.').pop();
  const photoPath = `${code}/${code}.${ext}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from('photo')
    .upload(photoPath, photoFile, { upsert: true });

  if (uploadError) {
    statusDiv.textContent = '❌ خطأ أثناء رفع صورة الهوية';
    return;
  }

  // رفع الصور الإضافية
  const uploadedPhotoPaths = [];
  for (let i = 0; i < additionalPhotos.length; i++) {
    const photo = additionalPhotos[i];
    const path = `${code}/img${i + 1}.${photo.name.split('.').pop()}`;

    const { error } = await supabaseClient
      .storage
      .from('photo')
      .upload(path, photo, { upsert: true });

    if (error) {
      statusDiv.textContent = '❌ خطأ أثناء رفع الصور الإضافية';
      return;
    }
    uploadedPhotoPaths.push(path);
  }

  // حفظ البيانات
  const formData = {
    patient_name: document.getElementById('patientName').value.trim(),
    age: parseInt(document.getElementById('age').value),
    sex: document.getElementById('sex').value.trim(),
    code,
    photo_url: photoPath,
    additional_photos: uploadedPhotoPaths,
  };

  const { error: insertError } = await supabaseClient
    .from('pathology_report')
    .insert([formData]);

  if (insertError) {
    statusDiv.textContent = '❌ خطأ أثناء حفظ البيانات';
  } else {
    statusDiv.style.color = 'green';
    statusDiv.textContent = '✅ تم الحفظ بنجاح';
    form.reset();
    await initializeCode();
  }
});
