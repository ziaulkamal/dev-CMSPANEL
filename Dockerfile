# Dockerfile — image DEVELOPMENT Vite + Vue (hot-reload, pnpm). Default utk podman compose.
# Source di-mount sebagai volume (lihat compose.yaml); image hanya menyiapkan deps.
FROM node:22-alpine

# pnpm via corepack (versi mengikuti field packageManager di package.json).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Layer deps: manfaatkan cache selama lockfile tak berubah.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

EXPOSE 40201

# --host agar Vite dengar di 0.0.0.0 (terjangkau dari host).
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
