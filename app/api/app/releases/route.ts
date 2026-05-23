import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/app/releases
 * 
 * Fetches the latest releases from the GitHub repository using the GitHub token
 * This endpoint is used by mobile app and website to check for updates
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

function createDownloadUrl(version: string, filename: string): string {
  return `/api/app/download/${encodeURIComponent(version)}/${encodeURIComponent(filename)}`;
}

/**
 * Extract release notes from GitHub release body
 * Removes installation instructions and other boilerplate
 * Keeps only the actual release notes/features section
 */
function extractReleaseNotes(body: string): string {
  if (!body) return '';
  
  // Look for "Release Notes" or "What's New" section
  const releaseNotesMatch = body.match(/###\s*(?:Release Notes|What's New)([\s\S]*?)(?:###|$)/i);
  if (releaseNotesMatch) {
    return releaseNotesMatch[1].trim();
  }
  
  // Look for content after "## Features" or "## Changes"
  const featuresMatch = body.match(/##\s*(?:Features|Changes|Improvements)([\s\S]*?)(?:##|###|$)/i);
  if (featuresMatch) {
    return featuresMatch[1].trim();
  }
  
  // Remove installation instructions section
  let notes = body.replace(/##\s*Installation[\s\S]*?(?=##|###|$)/gi, '').trim();
  
  // Remove download/assets section
  notes = notes.replace(/##\s*(?:Download|Assets|Artifacts)[\s\S]*?(?=##|###|$)/gi, '').trim();
  
  // Remove note/disclaimer sections
  notes = notes.replace(/\*\*Note:[\s\S]*?(?=\n\n|$)/gi, '').trim();
  
  // If still too long with boilerplate, try to get first meaningful paragraph
  if (notes.length > 500) {
    const firstParagraph = notes.split('\n\n')[0];
    if (firstParagraph && firstParagraph.length > 50) {
      return firstParagraph;
    }
  }
  
  // Limit to reasonable length
  if (notes.length > 300) {
    return notes.substring(0, 300).trim() + '...';
  }
  
  return notes;
}

export async function GET(request: NextRequest) {
  try {
    // Optional query parameter to get a specific number of releases
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Fetch releases from GitHub API using native fetch
    const response = await fetch(`${GITHUB_API_URL}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Charter-Keke-App',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases: GitHubRelease[] = await response.json();

    // Filter out drafts and filter by limit
    const publicReleases = releases
      .filter((release) => !release.draft)
      .slice(0, limit)
      .map((release) => ({
        id: release.id,
        version: release.tag_name.replace(/^v/, ''),
        name: release.name,
        isPrerelease: release.prerelease,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        releaseNotes: extractReleaseNotes(release.body),
        assets: release.assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          downloadUrl: createDownloadUrl(release.tag_name.replace(/^v/, ''), asset.name),
          downloadCount: asset.download_count,
        })),
      }));

    // Cache the response for 5 minutes (shorter cache for faster updates)
    // Also add cache-busting headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'CDN-Cache-Control': 'max-age=300',
      'Pragma': 'no-cache',
    };

    return NextResponse.json(publicReleases, { headers });
  } catch (error) {
    console.error('[GET /api/app/releases] Error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Repository not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('403')) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch releases from GitHub' },
      { status: 500 }
    );
  }
}
