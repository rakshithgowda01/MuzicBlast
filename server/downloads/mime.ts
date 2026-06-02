export function inferMimeTypeFromExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  switch (normalized) {
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "webm":
      return "audio/webm";
    case "opus":
      return "audio/opus";
    case "ogg":
      return "audio/ogg";
    case "aac":
      return "audio/aac";
    case "wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}

