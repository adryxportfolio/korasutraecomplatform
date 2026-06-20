/* eslint-disable @typescript-eslint/no-explicit-any */

export type StorageUploadInput = {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
  folder: string;
  bucket: string;
};

export type StorageUploadResult = {
  path: string;
  url: string;
  bytes: number;
};

// Upload bytes to a public Supabase Storage bucket and return the public URL.
// Replaces the previous Cloudinary upload pipeline.
export async function uploadToSupabaseStorage(
  supabase: any,
  input: StorageUploadInput,
): Promise<StorageUploadResult> {
  const objectPath = `${input.folder}/${Date.now()}-${input.fileName}`.replace(/\/+/g, "/");

  const { error } = await supabase.storage.from(input.bucket).upload(objectPath, input.bytes, {
    contentType: input.contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message || "Supabase Storage upload failed");

  const { data } = supabase.storage.from(input.bucket).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("Supabase Storage did not return a public URL");

  return { path: objectPath, url: data.publicUrl, bytes: input.bytes.byteLength };
}
