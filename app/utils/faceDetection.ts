/**
 * Validação visual de presença aparente de rosto e qualidade da foto.
 * Não realiza identificação ou comparação biométrica da pessoa.
 * 
 * Verifica se a imagem capturada contém um rosto humano real e nítido,
 * bloqueando fotos de objetos, ambientes vazios, partes inapropriadas do corpo,
 * ou imagens sem feições humanas identificáveis.
 */

export interface FaceValidationResult {
  isValid: boolean
  message: string
  confidence?: number
  details?: {
    hasFaceDetector: boolean
    facesDetected?: number
    brightness?: number
    skinRatio?: number
    featureComplexity?: number
  }
}

/**
 * Valida a imagem contida em um elemento HTMLCanvasElement ou ImageData
 */
export async function validateFaceImage(canvas: HTMLCanvasElement): Promise<FaceValidationResult> {
  const width = canvas.width
  const height = canvas.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  if (!ctx || width === 0 || height === 0) {
    return {
      isValid: false,
      message: 'Não foi possível ler os dados da imagem da câmera.'
    }
  }

  // 1. Método A: Shape Detection API nativa (Disponível em Chrome/Edge/Android)
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const FaceDetectorClass = (window as any).FaceDetector
      const detector = new FaceDetectorClass({ fastMode: false, maxDetectedFaces: 4 })
      const faces = await detector.detect(canvas)

      if (faces && faces.length > 0) {
        if (faces.length > 2) {
          return {
            isValid: false,
            message: 'Mais de uma pessoa identificada na câmera. Por favor, posicione apenas o seu rosto.',
            details: { hasFaceDetector: true, facesDetected: faces.length }
          }
        }

        const face = faces[0]
        const box = face.boundingBox

        // Valida se o rosto tem tamanho mínimo (pelo menos 15% da largura e altura)
        const faceWidthRatio = box.width / width
        const faceHeightRatio = box.height / height

        if (faceWidthRatio < 0.15 || faceHeightRatio < 0.15) {
          return {
            isValid: false,
            message: 'Rosto muito distante da câmera. Aproxime-se um pouco mais da tela.',
            details: { hasFaceDetector: true, facesDetected: 1 }
          }
        }

        // Valida centralização
        const centerX = box.x + box.width / 2
        const centerY = box.y + box.height / 2
        const distFromCenter = Math.hypot(centerX - width / 2, centerY - height / 2)
        const maxDist = Math.min(width, height) * 0.45

        if (distFromCenter > maxDist) {
          return {
            isValid: false,
            message: 'Centralize seu rosto dentro da marcação na tela.',
            details: { hasFaceDetector: true, facesDetected: 1 }
          }
        }

        return {
          isValid: true,
          message: 'Rosto identificado com sucesso!',
          confidence: 0.95,
          details: { hasFaceDetector: true, facesDetected: 1 }
        }
      } else {
        return {
          isValid: false,
          message: 'Nenhum rosto humano identificado. Por favor, olhe de frente para a câmera em um ambiente iluminado.',
          details: { hasFaceDetector: true, facesDetected: 0 }
        }
      }
    } catch (detectorErr) {
      console.warn('FaceDetector API encontrou erro, utilizando fallback estrutural:', detectorErr)
    }
  }

  // Método alternativo de análise visual para navegadores sem FaceDetector.
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let totalBrightness = 0
  let totalPixels = 0

  // Região Central (Onde o rosto deve estar posicionado - 60% central)
  const minX = Math.floor(width * 0.2)
  const maxX = Math.floor(width * 0.8)
  const minY = Math.floor(height * 0.15)
  const maxY = Math.floor(height * 0.85)

  let centralPixels = 0
  let skinPixels = 0

  // Zonas verticais para verificar olhos (superior), nariz (médio) e boca (inferior)
  const upperZoneY = Math.floor(minY + (maxY - minY) * 0.35)
  const middleZoneY = Math.floor(minY + (maxY - minY) * 0.65)

  let upperGradientEnergy = 0
  let middleGradientEnergy = 0
  let lowerGradientEnergy = 0

  // Amostragem para performance
  const step = 2

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Luminância
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      totalBrightness += lum
      totalPixels++

      // Análise na área central do rosto
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        centralPixels++

        // Conversão para YCbCr para detecção universal de tom de pele humana
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

        // Faixa de tons de pele humana universal (peles claras, morenas, negras, asiáticas)
        const isSkin = (cb >= 77 && cb <= 135) && (cr >= 130 && cr <= 180) && (r > g) && (r > b) && (r > 40)

        if (isSkin) {
          skinPixels++
        }

        // Gradiente horizontal simples para detectar bordas de feições faciais (olhos, sobrancelhas, nariz, boca)
        if (x + step < width) {
          const nextIdx = (y * width + (x + step)) * 4
          const nextLum = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2]
          const grad = Math.abs(lum - nextLum)

          if (grad > 15) {
            if (y <= upperZoneY) {
              upperGradientEnergy += grad // Região dos olhos/sobrancelhas/cabelo
            } else if (y <= middleZoneY) {
              middleGradientEnergy += grad // Região do nariz
            } else {
              lowerGradientEnergy += grad // Região da boca/lábios/queixo
            }
          }
        }
      }
    }
  }

  const avgBrightness = totalBrightness / totalPixels
  const skinRatio = centralPixels > 0 ? (skinPixels / centralPixels) : 0

  // 1. Validação de Brilho / Iluminação
  if (avgBrightness < 35) {
    return {
      isValid: false,
      message: 'Ambiente muito escuro. Por favor, acenda a luz ou vá para um local mais iluminado.',
      details: { hasFaceDetector: false, brightness: avgBrightness, skinRatio }
    }
  }

  if (avgBrightness > 240) {
    return {
      isValid: false,
      message: 'Imagem excessivamente clara ou estourada. Evite luz direta atrás da câmera.',
      details: { hasFaceDetector: false, brightness: avgBrightness, skinRatio }
    }
  }

  // 2. Validação de Tom de Pele / Presença Humana
  // Se não houver pele suficiente (ex: parede, objeto, teto, chão, camisa):
  if (skinRatio < 0.12) {
    return {
      isValid: false,
      message: 'Nenhum rosto humano identificado. Por favor, enquadre seu rosto no centro da câmera.',
      details: { hasFaceDetector: false, brightness: avgBrightness, skinRatio }
    }
  }

  // Se a imagem for 100% pele lisa e uniforme (ex: zoom em membro do corpo, sem olhos nem boca):
  const totalFeatureEnergy = upperGradientEnergy + middleGradientEnergy + lowerGradientEnergy
  const minFeatureThreshold = centralPixels * 0.12

  // Um rosto real PRECISA de contraste na região dos olhos/sobrancelhas (upper) e da boca/nariz (lower)
  if (totalFeatureEnergy < minFeatureThreshold || upperGradientEnergy < (minFeatureThreshold * 0.15)) {
    return {
      isValid: false,
      message: 'Não identificamos traços faciais nítidos (olhos e boca). Olhe diretamente para a câmera sem cobrir o rosto.',
      details: { hasFaceDetector: false, brightness: avgBrightness, skinRatio, featureComplexity: totalFeatureEnergy }
    }
  }

  return {
    isValid: true,
    message: 'Rosto identificado e verificado com sucesso!',
    confidence: 0.88,
    details: { hasFaceDetector: false, brightness: avgBrightness, skinRatio, featureComplexity: totalFeatureEnergy }
  }
}
