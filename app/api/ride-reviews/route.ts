import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * POST /api/ride-reviews
 * Submit a ride review and rating
 * 
 * Body: {
 *   ride_id: string,
 *   reviewer_id: string (current user),
 *   rated_user_id: string (driver's user_id),
 *   rating: number (1-5),
 *   review_text: string,
 *   categories: { tags: string[] }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ride_id,
      reviewer_id,
      rated_user_id,
      rating,
      review_text,
      categories,
    } = body;

    // Validation
    if (!ride_id || !reviewer_id || !rated_user_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify that the reviewer is the one making the request
    if (reviewer_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot submit review for another user' },
        { status: 403 }
      );
    }

    // Check if review already exists for this ride
    const { data: existingReview } = await supabaseAdmin!
      .from('ride_reviews')
      .select('id')
      .eq('ride_id', ride_id)
      .eq('reviewer_id', reviewer_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this ride' },
        { status: 409 }
      );
    }

    // Insert the review
    console.log('[POST /api/ride-reviews] Inserting review with:', {
      ride_id,
      reviewer_id,
      rated_user_id,
      rating,
      review_text,
    });

    const { data: review, error: insertError } = await supabaseAdmin!
      .from('ride_reviews')
      .insert({
        ride_id,
        reviewer_id,
        rated_user_id,
        rating,
        review_text: review_text || null,
        categories: categories || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/ride-reviews] Error inserting review:', insertError);
      console.error('[POST /api/ride-reviews] Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        attempted_rated_user_id: rated_user_id,
      });
      return NextResponse.json(
        { error: 'Failed to submit review', details: insertError.message },
        { status: 500 }
      );
    }

    // The trigger on the database will automatically update the driver's average rating
    console.log('[POST /api/ride-reviews] Review submitted successfully:', review);

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('[POST /api/ride-reviews] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ride-reviews
 * Get reviews for a ride or user
 * 
 * Query params:
 * - ride_id: Get reviews for a specific ride
 * - user_id: Get reviews for a specific user (rated_user_id)
 * - limit: Number of results (default: 20)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rideId = url.searchParams.get('ride_id');
    const userId = url.searchParams.get('user_id');
    const reviewerId = url.searchParams.get('reviewer_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabaseAdmin!.from('ride_reviews').select('*');

    if (rideId) {
      query = query.eq('ride_id', rideId);
    }

    // user_id filters by rated_user_id (reviews ABOUT this user as driver)
    if (userId && !reviewerId) {
      query = query.eq('rated_user_id', userId);
    }

    // reviewer_id filters by reviewer_id (reviews SUBMITTED BY this user)
    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId);
    }

    const { data: reviews, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error('[GET /api/ride-reviews] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
