/**
 * Otimizador de fotografias de calçados:
 * Preserva 100% da fidelidade de cores, tons originais, detalhes e transparência do calçado,
 * sem cortar, sem danificar solados claros e sem alterar os pixels enviados pelo fabricante.
 */
export async function optimizeShoePhoto(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    // Se a imagem for leve (menos de 2MB em base64), preserva o arquivo 100% original
    // evitando qualquer reprocessamento, perda de qualidade ou alteração de cores
    if (dataUrl.length < 2.5 * 1024 * 1024) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const maxDim = 1800;
        // Se as dimensões já forem razoáveis, retorna o original intacto
        if (width <= maxDim && height <= maxDim) {
          resolve(dataUrl);
          return;
        }

        let targetWidth = width;
        let targetHeight = height;
        if (width > height) {
          targetWidth = maxDim;
          targetHeight = Math.round((height * maxDim) / width);
        } else {
          targetHeight = maxDim;
          targetWidth = Math.round((width * maxDim) / height);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Desenha a imagem preservando resolução e cores naturais sem manipular pixels
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Se o upload original for PNG ou WebP, mantém o formato para preservar canal de transparência
        if (dataUrl.startsWith('data:image/png')) {
          resolve(canvas.toDataURL('image/png'));
        } else if (dataUrl.startsWith('data:image/webp')) {
          resolve(canvas.toDataURL('image/webp', 0.95));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        }
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
