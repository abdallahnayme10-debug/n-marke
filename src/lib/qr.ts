import QRCode from "qrcode";

/** Génère un QR code PNG (data URL) pointant vers une annonce. */
export async function generateListingQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: "#203A52", light: "#FAF7F0" },
  });
}
