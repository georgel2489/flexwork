# Use Node.js to build the Next.js app
FROM node:18 AS build

# Set working directory inside the container
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files and Yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

# Copy the rest of the application code
COPY . .

# Build the production version of the Next.js app
RUN yarn build

# Use Node.js as the runtime
FROM node:18 AS production

# Set the working directory
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable

# Copy the built application from the previous stage
COPY --from=build /app /app

# Expose port 80
EXPOSE 80

# Set Node.js options for low-resource environments
ENV NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=2"
ENV UV_THREADPOOL_SIZE=2

# Start the Next.js server
CMD ["yarn", "start"]
