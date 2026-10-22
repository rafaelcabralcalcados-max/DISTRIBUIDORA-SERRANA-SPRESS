/**
 * Otimizador de fotografias de calçados:
 * Detecta fundos de estúdio claros/quase brancos e os funde perfeitamente com o fundo branco puro (#FFFFFF),
 * eliminando cantos, bordas e quadrados indesejados ao redor do produto.
 */
export async function optimizeShoePhoto(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Mantém dimensão máxima controlada para performance rápida e qualidade nítida
        const maxDim = 1200;
        let targetWidth = width;
        let targetHeight = height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            targetWidth = maxDim;
            targetHeight = Math.round((height * maxDim) / width);
          } else {
            targetHeight = maxDim;
            targetWidth = Math.round((width * maxDim) / height);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        // Amostra cantos para verificar se a foto tem fundo de estúdio claro
        const cornerCoords = [
          [2, 2],
          [targetWidth - 3, 2],
          [2, targetHeight - 3],
          [targetWidth - 3, targetHeight - 3],
        ];

        let cornerLuminanceSum = 0;
        for (const [cx, cy] of cornerCoords) {
          const idx = (cy * targetWidth + cx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          cornerLuminanceSum += 0.299 * r + 0.587 * g + 0.114 * b;
        }
        const avgCornerLuminance = cornerLuminanceSum / cornerCoords.length;

        // Se o fundo for claro (foto de estúdio comum > 210), unifica os pixels neutros para branco puro
        if (avgCornerLuminance > 210) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Pixel claro e neutro (baixo contraste cromático do fundo)
            if (lum > 228 && diff < 20) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            } else if (lum > 212 && diff < 14) {
              const factor = (lum - 212) / 16;
              data[i] = Math.round(r + (255 - r) * factor);
              data[i + 1] = Math.round(g + (255 - g) * factor);
              data[i + 2] = Math.round(b + (255 - b) * factor);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.94));
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
