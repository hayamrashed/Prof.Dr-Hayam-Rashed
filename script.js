// استيراد مكتبة Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// إعداد Supabase
const supabaseUrl = 'https://bnmgxpkqjhhhccaroibc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs'; // استخدم مفتاح الـ API الخاص بك
const supabase = createClient(supabaseUrl, supabaseKey);

// تعريف عناصر الصفحة
const form = document.getElementById('patientForm');
const statusDiv = document.getElementById('uploadStatus');

// ---------------------------
// وظائف مساعدة

// توليد الكود التالي تلقائياً
async function generateNextCode() {
  const { data, error } = await supabase
    .from('immunohistochemistry_report')
    .select('code')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return 'A1'; // في حال وجود خطأ أو لا توجد بيانات
  }

  if (!data || data.length === 0) {
    return 'A1';
  }

  const lastCode = data[0].code;
  const letter = lastCode.match(/[A-Z]/)[0];
  const number = parseInt(lastCode.match(/\d+/)[0], 10) + 1;
  return `${letter}${number}`;
}

// إعداد الكود في الحقل المخصص
async function initializeCode() {
  const generatedCode = await generateNextCode();
  const codeInput = document.getElementById('code');
  codeInput.value = generatedCode;
}

// التعامل مع الضغط على زر Enter داخل بعض الحقول
function handleEnterKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const cursorPosition = e.target.selectionStart;
    const textBefore = e.target.value.substring(0, cursorPosition);
    const textAfter = e.target.value.substring(cursorPosition);
    e.target.value = textBefore + "\n• " + textAfter;
    e.target.selectionStart = e.target.selectionEnd = cursorPosition + 3;
  }
}

// ---------------------------
// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
  const resultsField = document.getElementById('results');
  const diagnosisField = document.getElementById('diagnosis');

  initializeCode(); // توليد الكود مبدئياً

  resultsField.addEventListener('keydown', handleEnterKey);
  diagnosisField.addEventListener('keydown', handleEnterKey);
});

// ---------------------------
// عند إرسال النموذج
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const codeInput = document.getElementById('code');
  const code = codeInput.value.trim();
  const photoFile = document.getElementById('photo').files[0];
  const additionalPhotos = document.getElementById('additionalPhotos').files;

  // التحقق من وجود الكود والصورة الأساسية
  if (!code || !photoFile) {
    statusDiv.textContent = '❌ يرجى إدخال الكود واختيار صورة الهوية';
    return;
  }

  // رفع الصورة الأساسية
  const extension = photoFile.name.split('.').pop().toLowerCase();
  const photoPath = `${code}/${code}.${extension}`;

  const { error: uploadError } = await supabase
    .storage
    .from('photo')
    .upload(photoPath, photoFile, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    statusDiv.textContent = '❌ خطأ أثناء رفع صورة الهوية';
    return;
  }

  // رفع الصور الإضافية (إن وجدت)
  const uploadedPhotoPaths = [];
  for (let i = 0; i < additionalPhotos.length; i++) {
    const photo = additionalPhotos[i];
    const additionalPhotoPath = `${code}/img${i + 1}.${photo.name.split('.').pop()}`;

    const { error: additionalUploadError } = await supabase
      .storage
      .from('photo')
      .upload(additionalPhotoPath, photo, { upsert: true });

    if (additionalUploadError) {
      console.error(additionalUploadError);
      statusDiv.textContent = '❌ خطأ أثناء رفع الصورة الإضافية';
      return;
    }

    uploadedPhotoPaths.push(additionalPhotoPath);
  }

  // تجهيز بيانات المريض
  const formData = {
    patient_name: document.getElementById('patientName').value.trim(),
    sex: document.getElementById('sex').value.trim(),
    age: parseInt(document.getElementById('age').value),
    specimen_received_date: document.getElementById('specimenReceivedDate').value,
    date_report_issued: document.getElementById('dateReportIssued').value,
    referred_by: document.getElementById('referredBy').value.trim(),
    clinical_data: document.getElementById('clinicalData').value.trim(),
    specimen: document.getElementById('specimen').value.trim(),
    procedure: document.getElementById('procedure').value.trim(),
    results: document.getElementById('results').value.trim(),
    diagnosis: document.getElementById('diagnosis').value.trim(),
    code: code,
    photo_url: photoPath,
    additional_photos: uploadedPhotoPaths
  };

  // حفظ البيانات داخل Supabase
  const { error: insertError } = await supabase
    .from('immunohistochemistry_report')
    .insert([formData]);

  if (insertError) {
    console.error(insertError);
    statusDiv.textContent = '❌ خطأ أثناء حفظ بيانات المريض';
  } else {
    statusDiv.style.color = 'green';
    statusDiv.textContent = '✅ تم حفظ بيانات المريض وصورة الهوية والصور الإضافية بنجاح!';
    form.reset();
    await initializeCode(); // توليد كود جديد بعد الحفظ
  }
});
