export type CloudinaryUploadInput = {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
  folder: string;
};

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  resourceType: "image" | "video" | "raw";
  format: string | null;
  bytes: number;
};

export async function uploadToCloudinary(input: CloudinaryUploadInput): Promise<CloudinaryUploadResult> {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const formData = new FormData();
  formData.set("file", new Blob([input.bytes], { type: input.contentType }), input.fileName);
  formData.set("folder", input.folder);
  formData.set("use_filename", "true");
  formData.set("unique_filename", "true");
  formData.set("overwrite", "false");
  formData.set("tags", "korasutra,product-media");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Cloudinary upload failed (${response.status})`);
  }
  if (!data?.secure_url || !data?.public_id) throw new Error("Cloudinary upload response was incomplete");

  return {
    publicId: data.public_id,
    url: data.secure_url,
    resourceType: data.resource_type || "raw",
    format: data.format || null,
    bytes: Number(data.bytes || input.bytes.byteLength),
  };
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
