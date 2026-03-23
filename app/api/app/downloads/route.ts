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
      return NextResponse.json(
        { error: 'Missing required parameters: assetUrl and fileName' },
        { status: 400 }
      );
    }

    // Security: Validate that the URL is from GitHub
    if (!assetUrl.includes('github.com') && !assetUrl.includes('githubusercontent.com')) {
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

    // Fetch the file from GitHub
    const response = await fetch(assetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Charter-Keke-App',
        // Don't include GitHub token - public releases don't need auth
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `[GET /api/app/downloads] GitHub returned status ${response.status}`
      );
      return NextResponse.json(
        { error: 'Failed to fetch the app from GitHub' },
        { status: response.status }
      );
    }

    // Get the content length if available
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Create response with proper headers for direct download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`);
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    headers.set('X-Content-Type-Options', 'nosniff');
    
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Stream the response body directly
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[GET /api/app/downloads] Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Download request timed out. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to download the app. Please try again.' },
      { status: 500 }
    );
  }
}
