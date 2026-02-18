import { createClient } from '@supabase/supabase-js';

/**
 * Uploads a file to Supabase storage using the service role key
 * This bypasses RLS policies and allows uploads from the server
 */
export async function uploadFileWithServiceRole(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase server env is missing (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }

    // Create Supabase client with service role key
    const serviceSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Upload file to storage
    const { data, error } = await serviceSupabase.storage
      .from(bucketName)
      .upload(filePath, new Uint8Array(fileBuffer), {
        contentType: contentType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = serviceSupabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('File upload error:', {
      bucketName,
      filePath,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Deletes a file from Supabase storage using the service role key
 */
export async function deleteFileWithServiceRole(
  bucketName: string,
  filePath: string
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase server env is missing (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }

    const serviceSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await serviceSupabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}
