// ==================================================
// هذا الملف يعمل مباشرة في المتصفح
// يجب تحميل Supabase من CDN قبل هذا الملف
// ==================================================
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js"></script>
// <script src="script2.js"></script>
// ==================================================


// --------------------------------------------------
// انتظار تحميل مكتبة Supabase (حل جذري لكل الأخطاء)
// --------------------------------------------------
function waitForSupabase(callback) {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    callback();
  } else {
    setTimeout(() => waitForSupabase(callback), 50);
  }
}

waitForSupabase(() => {
  console.log("✅ Supabase CDN Loaded");

  // --------------------------------------------------
  // إعداد Supabase
  // --------------------------------------------------
  const SUPABASE_URL = "https://fbxphgrumfifpanlkbzd.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieHBoZ3J1bWZpZnBhbmxrYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Mzg1NTQsImV4cCI6MjA2MTQxNDU1NH0.gaS2hTxSTniuedtKxTStMKC4e-72Y554aYTYGKEBoDE";

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  console.log("✅ Supabase Client Ready");

  // --------------------------------------------------
  // عناصر الصفحة
  // --------------------------------------------------
  const form = document.getElementById("patientForm");
  const statusDiv = document.getElementById("uploadStatus");

  if (!form) {
    console.error("❌ patientForm غير موجود في الصفحة");
    return;
  }

  // --------------------------------------------------
  // توليد الكود تلقائيًا
  // --------------------------------------------------
  async function generateNextCode() {
    const { data, error } = await supabaseClient
      .from("pathology_report")
      .select("code")
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return "D1";
    }

    const lastCode = data[0].code;
    const letter = lastCode.match(/[A-Z]/)?.[0] || "D";
    const number = parseInt(lastCode.match(/\d+/)?.[0] || "0", 10) + 1;

    return `${letter}${number}`;
  }

  // --------------------------------------------------
  // تهيئة الكود عند التحميل
  // --------------------------------------------------
  async function initializeCode() {
    let codeInput = document.getElementById("code");

    if (!codeInput) {
      codeInput = document.createElement("input");
      codeInput.type = "hidden";
      codeInput.id = "code";
      form.appendChild(codeInput);
    }

    codeInput.value = await generateNextCode();
  }

  document.addEventListener("DOMContentLoaded", initializeCode);

  // --------------------------------------------------
  // إرسال النموذج
  // --------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusDiv.textContent = "⏳ جاري الحفظ...";

    const code = document.getElementById("code").value;
    const photoFile = document.getElementById("photo")?.files[0];
    const additionalPhotos =
      document.getElementById("additionalPhotos")?.files || [];

    if (!photoFile) {
      statusDiv.textContent = "❌ يرجى اختيار صورة الهوية";
      return;
    }

    // ---------------- رفع صورة الهوية ----------------
    const ext = photoFile.name.split(".").pop();
    const photoPath = `${code}/${code}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("photo")
      .upload(photoPath, photoFile, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      statusDiv.textContent = "❌ فشل رفع صورة الهوية";
      return;
    }

    // ---------------- رفع الصور الإضافية ----------------
    const uploadedPhotos = [];

    for (let i = 0; i < additionalPhotos.length; i++) {
      const file = additionalPhotos[i];
      const path = `${code}/img${i + 1}.${file.name.split(".").pop()}`;

      const { error } = await supabaseClient.storage
        .from("photo")
        .upload(path, file, { upsert: true });

      if (error) {
        console.error(error);
        statusDiv.textContent = "❌ فشل رفع الصور الإضافية";
        return;
      }

      uploadedPhotos.push(path);
    }

    // ---------------- حفظ البيانات ----------------
    const formData = {
      patient_name: document.getElementById("patientName").value.trim(),
      age: parseInt(document.getElementById("age").value),
      sex: document.getElementById("sex").value,
      specimen_received_date:
        document.getElementById("specimenReceivedDate").value,
      report_issued_date:
        document.getElementById("reportIssuedDate").value,
      referred_by: document.getElementById("referredBy").value.trim(),
      specimen_information:
        document.getElementById("specimenInformation").value.trim(),
      clinical_data: document.getElementById("clinicalData").value.trim(),
      gross_picture: document.getElementById("grossPicture").value.trim(),
      microscopic_picture:
        document.getElementById("microscopicPicture").value.trim(),
      diagnosis: document.getElementById("diagnosis").value.trim(),
      doctor_signature:
        document.getElementById("doctorSignature").value.trim(),
      code: code,
      photo_url: photoPath,
      additional_photos: uploadedPhotos,
    };

    const { error: insertError } = await supabaseClient
      .from("pathology_report")
      .insert([formData]);

    if (insertError) {
      console.error(insertError);
      statusDiv.textContent = "❌ فشل حفظ البيانات";
      return;
    }

    statusDiv.style.color = "green";
    statusDiv.textContent = "✅ تم الحفظ بنجاح";
    form.reset();
    await initializeCode();
  });
});
