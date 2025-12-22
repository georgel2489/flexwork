# Backend Dockerfile
FROM node:18
WORKDIR /usr/src/app

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files and Yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

# Copy application code
COPY . .

EXPOSE 4000

# Set Node.js options for low-resource environments
ENV NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=2"
ENV UV_THREADPOOL_SIZE=2

CMD ["yarn", "start"]
