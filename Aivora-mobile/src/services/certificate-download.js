import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PDF_WIDTH = 792;
const PDF_HEIGHT = 612;

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const buildAssetUrl = (baseUrl, assetPath) => {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanPath = String(assetPath || '').startsWith('/') ? assetPath : `/${assetPath}`;
  return `${cleanBase}${cleanPath}`;
};

const sanitizeFilePart = (value, fallback) => {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US');
};

const buildCertificateHtml = ({ certificate, baseUrl }) => {
  const templateUrl = buildAssetUrl(baseUrl, '/tem.png');
  const logoUrl = buildAssetUrl(baseUrl, '/aivora2.png');
  const studentName = escapeHtml(certificate?.studentName || '-');
  const courseTitle = escapeHtml(certificate?.courseTitle || '-');
  const issuerDate = escapeHtml(formatDate(certificate?.issuedAt));

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @page { size: ${PDF_WIDTH}px ${PDF_HEIGHT}px; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        font-family: Arial, sans-serif;
        background: #ffffff;
      }
      .sheet {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: #ffffff;
      }
      .bg { width: 100%; height: 100%; object-fit: cover; display: block; }
      .overlay { position: absolute; inset: 0; padding: 6% 8.5%; box-sizing: border-box; }
      .inner { margin-top: 18%; color: #0b2b5a; }
      .title { text-align: center; text-transform: uppercase; letter-spacing: 0.16em; font-size: 20px; font-weight: 700; }
      .subtitle { margin-top: 3px; text-align: center; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; font-weight: 700; color: rgba(11,43,90,0.8); }
      .presented { margin-top: 4%; text-align: center; text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; font-weight: 600; color: rgba(11,43,90,0.8); }
      .name { margin-top: 2.5%; text-align: center; font-size: 36px; font-weight: 700; color: #0b2b5a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .complete { margin-top: 2.5%; text-align: center; font-size: 14px; color: rgba(11,43,90,0.8); }
      .course { margin-top: 1%; text-align: center; font-size: 20px; font-weight: 700; color: #0b2b5a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .body { margin: 3% auto 0; max-width: 70%; text-align: center; font-size: 12px; line-height: 1.35; color: rgba(11,43,90,0.75); }
      .issuer { margin-top: 8%; display: flex; flex-direction: column; align-items: flex-end; color: rgba(11,43,90,0.85); }
      .logo { width: 130px; height: 38px; object-fit: contain; margin-bottom: 2px; }
      .brand { margin-bottom: 2px; font-size: 20px; letter-spacing: 0.08em; font-weight: 700; color: rgba(11,43,90,0.22); }
      .line { width: 128px; height: 1px; background: rgba(11,43,90,0.6); }
      .date { margin-top: 4px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <img class="bg" src="${templateUrl}" alt="" />
      <div class="overlay">
        <div class="inner">
          <div class="title">Certificate</div>
          <div class="subtitle">Of Appreciation</div>
          <div class="presented">This certificate is proudly presented to</div>
          <div class="name">${studentName}</div>
          <div class="complete">for successfully completing</div>
          <div class="course">${courseTitle}</div>
          <div class="body">This achievement reflects dedication, persistence, and mastery of the required learning outcomes for this course.</div>
          <div class="issuer">
            <img class="logo" src="${logoUrl}" alt="Aivora" />
            <div class="brand">AIVORA</div>
            <div class="line"></div>
            <div class="date">Issuer Date: ${issuerDate}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

export const downloadCertificatePdfNative = async ({ certificate, baseUrl }) => {
  if (!certificate) throw new Error('Certificate data is missing');
  const html = buildCertificateHtml({ certificate, baseUrl });
  const result = await Print.printToFileAsync({
    html,
    width: PDF_WIDTH,
    height: PDF_HEIGHT,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  const suffix = sanitizeFilePart(certificate.certificateNo || certificate.id, 'certificate');
  const outputUri = `${FileSystem.documentDirectory}aivora-certificate-${suffix}.pdf`;

  await FileSystem.copyAsync({ from: result.uri, to: outputUri });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(outputUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save certificate PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return outputUri;
};
