declare module 'ffprobe-static' {
  const info: { path: string };
  export default info;
}

declare module 'ffmpeg-static' {
  const path: string | null;
  export default path;
}
