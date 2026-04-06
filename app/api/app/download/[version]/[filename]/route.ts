import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/app/download/[version]/[filename]
 * 
 * Unified app download endpoint for website
 * Handles Android APK and iOS IPA downloads
 * Redirects to GitHub releases with proper headers
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

    // Add tracking header and redirect to GitHub
    console.log(`📥 [DOWNLOAD] Serving ${filename} for version ${version}`);
    
    return NextResponse.redirect(asset.browser_download_url, 302);
  } catch (error) {
    console.error('[GET /api/app/download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}
