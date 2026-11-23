import { getAdapter } from "../data/store";

/**
 * Uploads any media file (image, video, document, audio) directly to
 * the Supabase Storage bucket 'portfolio-media'.
 *
 * Returns file metadata object including the permanent public CDN URL.
 */
export async function uploadToCloudStorage(file, folder = "uploads") {
  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) {
    throw new Error("Supabase cloud database is not available.");
  }

  // Ensure clean filename
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}/${timestamp}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from("portfolio-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from("portfolio-media")
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl || "";
  const isVideo = file.type?.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

  return {
    id: filePath,
    path: filePath,
    name: file.name,
    url: publicUrl,
    kind: isVideo ? "video" : "image",
    mime: file.type,
    size: file.size,
    modified: timestamp,
    shared: true,
    isCloudFallback: true,
  };
}

/**
 * Lists files stored in Supabase Storage under the specified folder.
 */
export async function listCloudStorageFiles(folder = "uploads") {
  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.storage
      .from("portfolio-media")
      .list(folder, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error || !data) return [];

    return data
      .filter((item) => item.name && item.name !== ".emptyFolderPlaceholder")
      .map((item) => {
        const filePath = `${folder}/${item.name}`;
        const { data: urlData } = supabase.storage
          .from("portfolio-media")
          .getPublicUrl(filePath);
        const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(item.name);
        return {
          id: filePath,
          name: item.name.replace(/^\d+_/, ""),
          url: urlData?.publicUrl || "",
          kind: isVideo ? "video" : "image",
          mime: isVideo ? "video/mp4" : "image/jpeg",
          size: item.metadata?.size || 0,
          modified: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          shared: true,
        };
      });
  } catch {
    return [];
  }
}

