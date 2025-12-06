module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validar URL básica
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Superfocusbot/1.0; +https://superfocus.live)'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extraer OG image
    // Soporta comillas dobles y simples
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
    let imageUrl = ogImageMatch ? ogImageMatch[1] : null;

    // Si no hay OG image, buscar twitter:image
    if (!imageUrl) {
        const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
        imageUrl = twitterImageMatch ? twitterImageMatch[1] : null;
    }
    
    // Si es Spotify, intentar obtener imagen específica si falla OG tags estándar
    // Spotify suele tener og:image correcto, pero por si acaso.
    
    // Convertir URLs relativas a absolutas si es necesario
    if (imageUrl && !imageUrl.startsWith('http')) {
        try {
            const baseUrl = new URL(url);
            imageUrl = new URL(imageUrl, baseUrl.origin).href;
        } catch (e) {
            console.error('Error resolving relative URL:', e);
        }
    }

    // Extraer título si es posible
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : null);

     // Extraer descripción
    const ogDescMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = ogDescMatch ? ogDescMatch[1] : (descMatch ? descMatch[1] : null);


    res.status(200).json({
        success: true,
        image: imageUrl,
        title: title,
        description: description
    });

  } catch (error) {
    console.error('Error extracting metadata:', error);
    res.status(500).json({ error: 'Failed to extract metadata' });
  }
};

