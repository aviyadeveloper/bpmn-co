declare module "*.css";
declare module "@fontsource/*" {}
declare module "@fontsource-variable/*" {}

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
