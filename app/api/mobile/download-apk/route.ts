import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mobile/download-apk
 * 
 * Direct APK download endpoint
 * Proxies downloads from GitHub so mobile app doesn't need to go to GitHub directly
 * 
 * Query params:
 *  - release: Release tag (e.g., v2.0.0)
 *  - asset: Asset ID from GitHub
 */

const GITHUB_REPO = 'TECHTUNE-I-T-SOLUTIONS/charterkeke-mobile';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const releaseTag = searchParams.get('release');
    const assetId = searchParams.get('asset');

    if (!releaseTag || !assetId) {
      return NextResponse.json(
        { error: 'Missing required parameters: release and asset' },
        { status: 400 }
      );
    }

    if (!GITHUB_TOKEN) {
      console.error('GitHub token not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get release info from GitHub
    const releaseResponse = await fetch(
      `${GITHUB_API_URL}/tags/${releaseTag}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Charter-Keke-Mobile-App',
        },
      }
    );

    if (!releaseResponse.ok) {
      console.error(`Failed to fetch release: ${releaseResponse.status}`);
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    const release = await releaseResponse.json();

    // Find the asset with matching ID
    const asset = release.assets?.find(
      (a: any) => a.id === parseInt(assetId)
    );

    if (!asset) {
      console.error(`Asset ${assetId} not found in release ${releaseTag}`);
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Redirect to the direct GitHub download URL
    // This avoids CORS issues and provides a single download endpoint
    return NextResponse.redirect(asset.browser_download_url, 302);
  } catch (error) {
    console.error('[GET /api/mobile/download-apk] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve APK download' },
      { status: 500 }
    );
  }
}

/**
 * Alternative approach: Stream the APK directly from GitHub
 * (Commented out - use redirect above instead for simplicity)
 * 
 * This would be used if you wanted to proxy the actual file bytes
 * instead of just redirecting to GitHub
 */
/*
export async function GET_STREAM(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const releaseTag = searchParams.get('release');
    const assetId = searchParams.get('asset');

    if (!releaseTag || !assetId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch the asset info
    const response = await fetch(
      `${GITHUB_API_URL}/tags/${releaseTag}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
        },
      }
    );

    const release = await response.json();
    const asset = release.assets.find((a: any) => a.id === parseInt(assetId));

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Fetch the actual APK file
    const fileResponse = await fetch(asset.browser_download_url);

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download APK' },
        { status: 500 }
      );
    }

    // Stream the file
    return new NextResponse(fileResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${asset.name}"`,
        'Content-Length': fileResponse.headers.get('content-length') || '',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[GET /api/mobile/download-apk] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve APK' },
      { status: 500 }
    );
  }
}
*/
