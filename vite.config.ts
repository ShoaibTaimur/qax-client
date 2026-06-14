// import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// import { nitro } from "nitro/vite";

// export default defineConfig({
//   vite: {
//     plugins: [
//       nitro({
//         preset: "vercel",
//       }),
//     ],
//   },
//   tanstackStart: {
//     server: { entry: "server" },
//   },
// });
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
