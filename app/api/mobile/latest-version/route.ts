import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mobile/latest-version
 * 
 * Returns the latest app version info for the mobile app to use
 * Mobile app calls this to check for updates and get the download URL
 */

const GITHUB_REPO = 'TECHTUNE-I-T-SOLUTIONS/charterkeke-mobile';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  body: string;
  assets: Array<{
    id: number;
    name: string;
    download_count: number;
    browser_download_url: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Fetch latest release from GitHub API
    const response = await fetch(`${GITHUB_API_URL}?per_page=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Charter-Keke-Mobile-App',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases: GitHubRelease[] = await response.json();

    if (!releases || releases.length === 0) {
      return NextResponse.json(
        { error: 'No releases found' },
        { status: 404 }
      );
    }

    const release = releases[0];

    // Filter out drafts
    if (release.draft) {
      return NextResponse.json(
        { error: 'No public releases found' },
        { status: 404 }
      );
    }

    // Find platform assets
    const apkAsset = release.assets.find((asset) => asset.name.endsWith('.apk'));
    const iosAsset = release.assets.find((asset) => asset.name.endsWith('.ipa'));

    if (!apkAsset && !iosAsset) {
      return NextResponse.json(
        { error: 'No mobile app assets found for this release' },
        { status: 404 }
      );
    }

    // Create direct download URL using our proxy endpoint
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000';
    
    const androidDownloadUrl = apkAsset
      ? `${apiBaseUrl}/api/mobile/download-apk?release=${release.tag_name}&asset=${apkAsset.id}`
      : null;
    const iosDownloadUrl = iosAsset
      ? `${apiBaseUrl}/api/mobile/download-apk?release=${release.tag_name}&asset=${iosAsset.id}`
      : null;

    const versionInfo = {
      version: release.tag_name.replace(/^v/, ''),
      buildNumber: parseInt(release.tag_name.split('.').pop() || '0'),
      releaseDate: release.published_at,
      downloadUrl: androidDownloadUrl || iosDownloadUrl,
      androidDownloadUrl,
      iosDownloadUrl,
      assets: release.assets
        .filter((asset) => asset.name.endsWith('.apk') || asset.name.endsWith('.ipa'))
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          downloadUrl: `${apiBaseUrl}/api/mobile/download-apk?release=${release.tag_name}&asset=${asset.id}`,
        })),
      releaseNotes: release.body,
      features: extractFeatures(release.body),
      isRequired: false,
      minimumSupportedVersion: '1.0.0',
    };

    // Cache for 12 hours
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=43200, s-maxage=43200',
    };

    return NextResponse.json(versionInfo, { headers });
  } catch (error) {
    console.error('[GET /api/mobile/latest-version] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch version information' },
      { status: 500 }
    );
  }
}

/**
 * Extract feature list from release notes
 */
function extractFeatures(releaseNotes: string): string[] {
  const features: string[] = [];
  const lines = releaseNotes.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match common bullet points and list items
    if (trimmed.match(/^[-*+✨✅🎉]/)) {
      const feature = trimmed.replace(/^[-*+✨✅🎉]\s*/, '').trim();
      if (feature && feature.length > 0 && feature.length < 100) {
        features.push(feature);
      }
    }
  }

  // Return top 5 features
  return features.slice(0, 5);
}
