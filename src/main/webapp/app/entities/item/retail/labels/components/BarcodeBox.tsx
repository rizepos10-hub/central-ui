import React, { useEffect, useState } from 'react';
import { BarcodeSymbology, validateBarcodeData } from '../model/label-template.model';
import { barcodePadMm, barcodePngDataUrl, qrPngDataUrl } from '../util/code-images';

type BarcodeBoxProps = {
  data: string;
  symbology: BarcodeSymbology;
  widthPx: number;
  heightPx: number;
  scale: number;
};

// Renders the barcode from the same image jsPDF uses, stretched to fill exactly like the PDF — so preview == print.
export const BarcodeBox = React.memo(({ data, symbology, widthPx, heightPx, scale }: BarcodeBoxProps) => {
  const error = data ? validateBarcodeData(symbology, data) : 'No barcode data';
  if (error) {
    return <InvalidBox message={error} widthPx={widthPx} heightPx={heightPx} />;
  }
  const url = barcodePngDataUrl(data, symbology);
  if (!url) {
    return <InvalidBox message="Barcode error" widthPx={widthPx} heightPx={heightPx} />;
  }

  const widthMm = scale > 0 ? widthPx / scale : widthPx;
  const padXpx = barcodePadMm(widthMm) * (scale > 0 ? scale : 1);

  return (
    <div
      style={{
        width: widthPx,
        height: heightPx,
        background: '#ffffff',
        boxSizing: 'border-box',
        padding: `0 ${padXpx}px`,
        overflow: 'hidden',
      }}
    >
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', imageRendering: 'pixelated' }} />
    </div>
  );
});

BarcodeBox.displayName = 'BarcodeBox';

type QrBoxProps = {
  data: string;
  sizePx: number;
};

// Renders the QR from the same generator jsPDF uses (same library, level and margin) so preview == print.
export const QrBox = React.memo(({ data, sizePx }: QrBoxProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!data) {
      setUrl(null);
      return undefined;
    }
    qrPngDataUrl(data).then(result => {
      if (active) setUrl(result);
    });
    return () => {
      active = false;
    };
  }, [data]);

  if (!data) {
    return <InvalidBox message="No QR data" widthPx={sizePx} heightPx={sizePx} />;
  }

  const side = Math.max(Math.floor(sizePx), 16);
  return (
    <div style={{ width: '100%', height: '100%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url && <img src={url} alt="" width={side} height={side} style={{ display: 'block', imageRendering: 'pixelated' }} />}
    </div>
  );
});

QrBox.displayName = 'QrBox';

type InvalidBoxProps = {
  message: string;
  widthPx: number;
  heightPx: number;
};

const InvalidBox = ({ message, widthPx, heightPx }: InvalidBoxProps) => (
  <div
    style={{
      width: widthPx,
      height: heightPx,
      border: '1px solid rgba(220,38,38,0.4)',
      background: 'rgba(220,38,38,0.08)',
      color: '#dc2626',
      fontSize: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 2,
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}
  >
    {message}
  </div>
);
