# Backend Dockerfile
FROM node:18
WORKDIR /usr/src/app

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files and Yarn Berry configuration
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn .yarn

# Install dependencies
RUN yarn install --immutable

# Copy application code
COPY . .

EXPOSE 3001
CMD ["yarn", "start"]
