// print2.js

// طباعة التقرير كملف PDF (عبر نافذة الطباعة)
function printReport() {
    window.print();
}

// حفظ التقرير كصورة
function saveAsImage() {
    const report = document.getElementById('patientReport');
    html2canvas(report).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Patient_Report.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// توليد وتحميل QR كود
function generateAndDownloadQR() {
    const qr = new QRious({
        value: window.location.href,
        size: 250
    });

    const link = document.createElement('a');
    link.download = 'Patient_QR.png';
    link.href = qr.toDataURL('image/png');
    link.click();
}
