// ربط مع Supabase
const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs'; // استخدم مفتاح الـ API الخاص بك
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

function showPhotoLoader() {
  document.getElementById('photo-loader').style.display = 'block';
}

async function loadPhotos() {
  const code = document.getElementById('photo-code').value.trim();
  const photosContainer = document.getElementById('photos-display');
  photosContainer.innerHTML = '';

  if (code === '') {
    alert('يرجى إدخال رقم الكود.');
    return;
  }

  // تحميل الصور من supabase
  let { data, error } = await supabase
    .storage
    .from('photo')
    .list(code, { limit: 100 });

  if (error || !data.length) {
    alert('لم يتم العثور على صور لهذا الكود.');
    return;
  }

  data.forEach(file => {
    const { publicURL } = supabase
      .storage
      .from('photo')
      .getPublicUrl(`${code}/${file.name}`);
      
    const img = document.createElement('img');
    img.src = publicURL;
    img.alt = "صورة الكود";
    img.style.width = "200px";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    photosContainer.appendChild(img);
  });
}
