<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نموذج المريض</title>
</head>
<body>

  <h1>نموذج بيانات المريض</h1>

  <form id="patientForm">
    <input type="text" id="patientName" placeholder="اسم المريض" required>
    <input type="number" id="age" placeholder="العمر" required>
    <select id="sex" required>
      <option value="">الجنس</option>
      <option value="ذكر">ذكر</option>
      <option value="أنثى">أنثى</option>
    </select>
    <input type="date" id="specimenReceivedDate" required>
    <input type="date" id="reportIssuedDate" required>
    <input type="text" id="referredBy" placeholder="إحالة من">
    <textarea id="specimenInformation" placeholder="معلومات العينة"></textarea>
    <textarea id="clinicalData" placeholder="البيانات السريرية"></textarea>
    <input type="text" id="grossPicture" placeholder="Gross picture">
    <input type="text" id="microscopicPicture" placeholder="Microscopic picture">
    <textarea id="diagnosis" placeholder="التشخيص"></textarea>
    <input type="text" id="doctorSignature" placeholder="توقيع الطبيب">

    <input type="file" id="photo" required>
    <input type="file" id="additionalPhotos" multiple>

    <button type="submit">حفظ البيانات</button>
  </form>

  <div id="uploadStatus"></div>

  <!-- تحميل مكتبة Supabase أولًا -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js"></script>
  
  <!-- تحميل السكريبت الخاص بك بعد المكتبة -->
  <script src="script2.js"></script>

</body>
</html>
