// ================================
// تهيئة Supabase (بدون import)

console.log("Supabase loaded? =>", supabase.createClient);

// إعداد Supabase
const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs";

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// ================================
// تعريف عناصر الصفحة

const form = document.getElementById("patientForm");
const statusDiv = document.getElementById("uploadStatus");

// ================================
// توليد الكود التالي تلقائياً

async function generateNextCode() {
  const { data, error } = await supabaseClient
    .from("pathology_report") // أو الجدول المناسب
    .select("code")
    .not("code", "is", null)      // تجاهل القيم الفارغة
    .order("code", { ascending: false }) // الترتيب على الكود نفسه
    .limit(1);

  if (error) {
    console.error(error);
    return "D1";
  }

  if (!data || data.length === 0 || !data[0].code) {
    return "D1";
  }

  const lastCode = data[0].code;

  const letterMatch = lastCode.match(/[A-Z]/);
  const numberMatch = lastCode.match(/\d+/);

  if (!letterMatch || !numberMatch) {
    return "D1";
  }

  const letter = letterMatch[0];
  const number = parseInt(numberMatch[0], 10) + 1;

  return `${letter}${number}`;
}


// ================================
// عند تحميل الصفحة

document.addEventListener("DOMContentLoaded", async () => {
  await initializeCode();
});

// ================================
// إعداد الكود مبدئياً

async function initializeCode() {
  const generatedCode = await generateNextCode();
  let codeInput = document.getElementById("code");

  if (!codeInput) {
    codeInput = document.createElement("input");
    codeInput.type = "hidden";
    codeInput.id = "code";
    form.appendChild(codeInput);
  }

  codeInput.value = generatedCode;
}

// ================================
// عند إرسال النموذج

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = document.getElementById("code").value.trim();
  const photoFile = document.getElementById("photo").files[0];
  const additionalPhotos =
    document.getElementById("additionalPhotos").files;

  if (!code || !photoFile) {
    statusDiv.textContent = "❌ يرجى إدخال الكود واختيار صورة الهوية";
    return;
  }

  // --------------------
  // رفع صورة الهوية

  const extension = photoFile.name.split(".").pop().toLowerCase();
  const photoPath = `${code}/${code}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("photo")
    .upload(photoPath, photoFile, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    statusDiv.textContent = "❌ خطأ أثناء رفع صورة الهوية";
    return;
  }

  // --------------------
  // رفع الصور الإضافية

  const uploadedPhotoPaths = [];

  for (let i = 0; i < additionalPhotos.length; i++) {
    const photo = additionalPhotos[i];
    const additionalPhotoPath = `${code}/img${i + 1}.${photo.name
      .split(".")
      .pop()}`;

    const { error: additionalUploadError } =
      await supabaseClient.storage
        .from("photo")
        .upload(additionalPhotoPath, photo, { upsert: true });

    if (additionalUploadError) {
      console.error(additionalUploadError);
      statusDiv.textContent = "❌ خطأ أثناء رفع الصور الإضافية";
      return;
    }

    uploadedPhotoPaths.push(additionalPhotoPath);
  }

  // --------------------
  // تجهيز بيانات النموذج

  const formData = {
    patient_name: document.getElementById("patientName").value.trim(),
    age: parseInt(document.getElementById("age").value),
    sex: document.getElementById("sex").value.trim(),
    specimen_received_date:
      document.getElementById("specimenReceivedDate").value,
    report_issued_date:
      document.getElementById("reportIssuedDate").value,
    referred_by: document.getElementById("referredBy").value.trim(),
    specimen_information:
      document.getElementById("specimenInformation").value.trim(),
    clinical_data:
      document.getElementById("clinicalData").value.trim(),
    gross_picture:
      document.getElementById("grossPicture").value.trim(),
    microscopic_picture:
      document.getElementById("microscopicPicture").value.trim(),
    diagnosis:
      document.getElementById("diagnosis").value.trim(),
    doctor_signature:
      document.getElementById("doctorSignature").value.trim(),
    code: code,
    photo_url: photoPath,
    additional_photos: uploadedPhotoPaths,
  };

  // --------------------
  // حفظ البيانات

  const { error: insertError } = await supabaseClient
    .from("pathology_report")
    .insert([formData]);

  if (insertError) {
    console.error(insertError);
    statusDiv.textContent = "❌ خطأ أثناء حفظ بيانات المريض";
  } else {
    statusDiv.style.color = "green";
    statusDiv.textContent =
      "✅ تم حفظ بيانات المريض وصورة الهوية والصور الإضافية بنجاح!";
    form.reset();
    await initializeCode();
  }
});

