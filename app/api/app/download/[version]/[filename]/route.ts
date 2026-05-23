import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/app/download/[version]/[filename]
 * 
 * Unified app download endpoint for website
 * Handles Android APK and iOS IPA downloads
 * Streams artifacts from GitHub releases using the server token so users
 * never leave the website download flow.
 */

const GITHUB_REPO = 'TECHTUNE-I-T-SOLUTIONS/charterkeke-mobile';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GitHubAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ version: string; filename: string }> }
) {
  try {
    const { version, filename } = await params;

    if (!version || !filename) {
      return NextResponse.json(
        { error: 'Missing version or filename' },
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

    // Construct the release tag from version
    const releaseTag = `v${version}`;

    // Fetch release from GitHub
    const response = await fetch(
      `${GITHUB_API_URL}/tags/${releaseTag}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Charter-Keke-Download-Server',
        },
      }
    );

    if (!response.ok) {
      console.error(`Release not found: ${releaseTag}`);
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const release = await response.json();

    // Find the matching asset
    const asset = release.assets?.find(
      (a: GitHubAsset) => a.name === filename
    );

    if (!asset) {
      console.error(`Asset not found: ${filename} in ${releaseTag}`);
      return NextResponse.json(
        { error: 'File not found for this version' },
        { status: 404 }
      );
    }

    console.log(`📥 [DOWNLOAD] Streaming ${filename} for version ${version}`);

    const assetResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${asset.id}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Charter-Keke-Download-Server',
        },
      }
    );

    if (!assetResponse.ok) {
      console.error(
        `Failed to fetch asset ${asset.id} (${filename}): ${assetResponse.status}`
      );
      return NextResponse.json(
        { error: 'Unable to download file' },
        { status: 502 }
      );
    }

    const contentType = assetResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = assetResponse.headers.get('content-length') || asset.size.toString();
    const body = await assetResponse.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Content-Disposition': `attachment; filename="${asset.name}"`,
        'Cache-Control': 'no-store',
        'X-Download-Source': 'github-proxy',
      },
    });
  } catch (error) {
    console.error('[GET /api/app/download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}
