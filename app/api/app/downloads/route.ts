import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/app/downloads?assetUrl=<url>&fileName=<name>
 * 
 * Proxies direct downloads from GitHub releases without redirecting
 * This allows anonymous users to download APKs directly from the website
 * 
 * Query Parameters:
 * - assetUrl: The GitHub release asset download URL (required)
 * - fileName: The filename for the downloaded file (required)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetUrl = searchParams.get('assetUrl');
    const fileName = searchParams.get('fileName');

    // Validate inputs
    if (!assetUrl || !fileName) {
      console.error('[GET /api/app/downloads] Missing parameters', {
        assetUrl: !!assetUrl,
        fileName: !!fileName,
      });
      return NextResponse.json(
        { error: 'Missing required parameters: assetUrl and fileName' },
        { status: 400 }
      );
    }

    console.log('[GET /api/app/downloads] Download request', {
      fileName,
      assetUrlHost: new URL(assetUrl).hostname,
    });

    // Security: Validate that the URL is from GitHub
    if (!assetUrl.includes('github.com') && !assetUrl.includes('githubusercontent.com')) {
      console.error('[GET /api/app/downloads] Invalid URL source', { assetUrl });
      return NextResponse.json(
        { error: 'Invalid asset URL. Only GitHub URLs are supported.' },
        { status: 400 }
      );
    }

    // Sanitize the filename to prevent path traversal
    const safeFileName = fileName
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/[<>:"/\\|?*]/g, '_')
      .slice(0, 255);

    // Set a timeout for the download (5 minutes)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);

    try {
      // Fetch the file from GitHub with proper headers
      const response = await fetch(assetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Charter-Keke-App/2.0.0',
          'Accept': 'application/octet-stream',
        },
        signal: controller.signal,
        redirect: 'follow', // Follow redirects from GitHub
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error('[GET /api/app/downloads] GitHub fetch failed', {
          status: response.status,
          statusText: response.statusText,
          url: assetUrl,
        });
        return NextResponse.json(
          {
            error: `Failed to fetch the app from GitHub (HTTP ${response.status})`,
          },
          { status: response.status }
        );
      }

      // Read the response as an ArrayBuffer to ensure we have the data
      const buffer = await response.arrayBuffer();

      if (buffer.byteLength === 0) {
        console.error('[GET /api/app/downloads] Empty file downloaded');
        return NextResponse.json(
          { error: 'Downloaded file is empty' },
          { status: 500 }
        );
      }

      // Get the content length if available
      const contentLength = response.headers.get('content-length') || buffer.byteLength.toString();
      const contentType =
        response.headers.get('content-type') || 'application/octet-stream';

      console.log('[GET /api/app/downloads] Download complete', {
        fileName: safeFileName,
        contentLength,
        bufferSize: buffer.byteLength,
        contentType,
      });

      // Create response with proper headers for direct download
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set(
        'Content-Disposition',
        `attachment; filename="${safeFileName}"`
      );
      headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Access-Control-Allow-Origin', '*'); // Allow CORS
      headers.set('Content-Length', contentLength);

      // Return the buffer as the response
      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[GET /api/app/downloads] Download timeout');
        return NextResponse.json(
          {
            error: 'Download request timed out. Please try again.',
          },
          { status: 408 }
        );
      }

      console.error('[GET /api/app/downloads] Fetch error', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('[GET /api/app/downloads] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to download the app. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
