"use client";

async function srcToDataUrl(src: string): Promise<string> {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load image: ${src}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read image: ${src}`));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const dataUrl = await srcToDataUrl(src);
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to decode image: ${src}`));
    image.src = dataUrl;
  });
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
  color: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * lineHeight);
  });

  ctx.restore();
}

async function renderCertificateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(920, Math.ceil(rect.width || 920));
  const height = Math.round(width * 0.707);
  const scale = 2;

  const images = Array.from(element.querySelectorAll("img"));
  const backgroundSrc = images[0]?.getAttribute("src") || "/tem.png";
  const logoSrc = images[1]?.getAttribute("src") || "/alaa.png";

  const [background, logo] = await Promise.all([loadImage(backgroundSrc), loadImage(logoSrc)]);

  const studentName =
    element.querySelector("h1")?.textContent?.trim() || "Student Name";
  const courseTitle =
    Array.from(element.querySelectorAll("p"))
      .map((node) => node.textContent?.trim() || "")
      .find((text) => text && text !== "Certificate" && text !== "Of Appreciation" && text !== "for successfully completing" && !text.startsWith("This certificate is proudly") && !text.startsWith("This achievement reflects")) || "Course Title";
  const issuerDateText =
    Array.from(element.querySelectorAll("span"))
      .map((node) => node.textContent?.trim() || "")
      .find((text) => text.startsWith("Issuer Date:")) || "";

  const description =
    Array.from(element.querySelectorAll("p"))
      .map((node) => node.textContent?.trim() || "")
      .find((text) => text.startsWith("This achievement reflects")) ||
    "This achievement reflects dedication, persistence, and mastery of the required learning outcomes for this course.";

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is unavailable");
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(background, 0, 0, width, height);

  const navy = "#0b2b5a";
  const muted = "rgba(11, 43, 90, 0.8)";
  const centerX = width / 2;

  drawCenteredText(ctx, "CERTIFICATE", centerX, height * 0.20, `600 ${width * 0.022}px Georgia`, navy);
  drawCenteredText(ctx, "OF APPRECIATION", centerX, height * 0.245, `500 ${width * 0.013}px Georgia`, muted);
  drawCenteredText(
    ctx,
    "This certificate is proudly presented to",
    centerX,
    height * 0.34,
    `500 ${width * 0.012}px Arial`,
    muted
  );
  drawCenteredText(ctx, studentName, centerX, height * 0.415, `600 ${width * 0.032}px Georgia`, navy);
  drawCenteredText(
    ctx,
    "for successfully completing",
    centerX,
    height * 0.49,
    `500 ${width * 0.015}px Arial`,
    muted
  );
  drawCenteredText(ctx, courseTitle, centerX, height * 0.545, `600 ${width * 0.02}px Georgia`, navy);
  drawWrappedText(
    ctx,
    description,
    centerX,
    height * 0.62,
    width * 0.52,
    width * 0.018,
    `400 ${width * 0.012}px Arial`,
    "rgba(11, 43, 90, 0.75)"
  );

  const logoWidth = width * 0.12;
  const logoHeight = (logo.height / logo.width) * logoWidth;
  const logoX = width * 0.80;
  const logoY = height * 0.77;
  ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

  ctx.strokeStyle = "rgba(11, 43, 90, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.80, height * 0.87);
  ctx.lineTo(width * 0.92, height * 0.87);
  ctx.stroke();

  ctx.save();
  ctx.font = `400 ${width * 0.011}px Arial`;
  ctx.fillStyle = "rgba(11, 43, 90, 0.85)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(issuerDateText, width * 0.92, height * 0.895);
  ctx.restore();

  return canvas;
}

function buildPdfFromJpeg(jpegBytes: Uint8Array, imageWidth: number, imageHeight: number): Uint8Array {
  const pageWidth = imageWidth >= imageHeight ? 841.89 : 595.28;
  const pageHeight = imageWidth >= imageHeight ? 595.28 : 841.89;
  const margin = 24;
  const scale = Math.min(
    (pageWidth - margin * 2) / imageWidth,
    (pageHeight - margin * 2) / imageHeight
  );
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;

  const objects: Uint8Array[] = [];
  const encoder = new TextEncoder();

  const contentStream = encoder.encode(
    `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im0 Do\nQ`
  );

  objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.push(encoder.encode("<< /Type /Pages /Count 1 /Kids [3 0 R] >>"));
  objects.push(
    encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
        2
      )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
    )
  );
  objects.push(
    encoder.encode(
      `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`
    )
  );
  objects.push(encoder.encode(`<< /Length ${contentStream.length} >>`));

  const parts: Uint8Array[] = [encoder.encode("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n")];
  const offsets: number[] = [0];
  let cursor = parts[0].length;

  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(cursor);
    const header = encoder.encode(`${i + 1} 0 obj\n`);
    const footer = encoder.encode(i === 3 || i === 4 ? "\nstream\n" : "\n");
    const endStream = encoder.encode(i === 3 || i === 4 ? "\nendstream\nendobj\n" : "endobj\n");
    const payload = i === 3 ? jpegBytes : i === 4 ? contentStream : objects[i];
    parts.push(header, objects[i], footer, payload, endStream);
    cursor += header.length + objects[i].length + footer.length + payload.length + endStream.length;
  }

  const xrefOffset = cursor;
  const xrefHeader = encoder.encode(`xref\n0 ${objects.length + 1}\n`);
  parts.push(xrefHeader);

  const freeEntry = encoder.encode("0000000000 65535 f \n");
  parts.push(freeEntry);

  for (let i = 1; i < offsets.length; i += 1) {
    parts.push(encoder.encode(`${offsets[i].toString().padStart(10, "0")} 00000 n \n`));
  }

  parts.push(
    encoder.encode(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    )
  );

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const pdf = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    pdf.set(part, offset);
    offset += part.length;
  }

  return pdf;
}

export async function downloadCertificatePdf(element: HTMLElement, fileName: string) {
  const canvas = await renderCertificateCanvas(element);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const base64 = jpegDataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    jpegBytes[index] = binary.charCodeAt(index);
  }

  const pdfBytes = buildPdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  const normalizedPdfBytes = new Uint8Array(pdfBytes.byteLength);
  normalizedPdfBytes.set(pdfBytes);

  const blob = new Blob([normalizedPdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
