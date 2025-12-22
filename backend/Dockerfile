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
CMD ["yarn", "start"]
