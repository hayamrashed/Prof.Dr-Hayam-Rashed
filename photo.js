import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// إعداد supabase
const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs';
const supabase = createClient(supabaseUrl, supabaseKey)

// عرض الصور
document.getElementById('viewBtn').addEventListener('click', async () => {
  const code = document.getElementById('searchCode').value.trim()
  const output = document.getElementById('patientFiles')
  output.innerHTML = ''

  if (!code) {
    output.innerHTML = '❗ أدخل كود المريض'
    return
  }

  const { data, error } = await supabase.storage
    .from('photo')
    .list(`${code}/`, { limit: 100 })

  if (error || !data || data.length === 0) {
    output.innerHTML = '❌ لا توجد صور لهذا الكود'
    return
  }

  for (const file of data) {
    const { data: publicUrlData } = supabase
      .storage
      .from('photo')
      .getPublicUrl(`${code}/${file.name}`);

    const div = document.createElement('div');
    div.style.marginBottom = "20px";
    div.style.textAlign = "center";

    div.innerHTML = `
      <img src="${publicUrlData.publicUrl}" alt="صورة المريض" style="max-width: 250px; margin: 10px; border-radius: 8px; display: block; margin-left: auto; margin-right: auto;">
      <div style="margin-top: 8px; display: flex; justify-content: center; gap: 10px;">
        <button onclick="downloadImage('${publicUrlData.publicUrl}', '${file.name}')" style="background: #4CAF50; color: white; margin: 0px 90px 90px 0px; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer;">🔽 تحميل الصورة</button>
        <button onclick="deleteImage('${code}', '${file.name}', this)" style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer;">🗑️ حذف</button>
      </div>
    `;
    output.appendChild(div);
  }
})

// تحميل الصورة مع فتح نافذة حفظ
window.downloadImage = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    alert("❌ حدث خطأ أثناء تحميل الصورة");
    console.error(error);
  }
}

// حذف الصور
window.deleteImage = async (code, filename, button) => {
  const confirmDelete = confirm("هل تريد حذف هذه الصورة؟")
  if (!confirmDelete) return

  const { error } = await supabase.storage
    .from('photo')
    .remove([`${code}/${filename}`])

  if (!error) {
    button.parentElement.parentElement.remove()
  } else {
    alert("❌ حدث خطأ أثناء الحذف")
    console.error(error)
  }
}
