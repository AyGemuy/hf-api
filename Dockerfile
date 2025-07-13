FROM mcr.microsoft.com/playwright:focal

# Set environment variable untuk menghindari dialog pada Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# Tentukan work directory
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ImageMagick dan FFmpeg
RUN apt-get update && apt-get install -y \
    imagemagick \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy semua file ke container
COPY . .

# Install Playwright dependencies dan browser binaries
RUN npx playwright install --with-deps

# Expose port untuk aplikasi
EXPOSE 7860

# Start aplikasi
CMD ["npm", "start"]
