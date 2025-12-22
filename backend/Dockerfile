# Backend Dockerfile
FROM node:18
WORKDIR /usr/src/app

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --immutable

# Copy application code
COPY . .

EXPOSE 3001
CMD ["yarn", "start"]
