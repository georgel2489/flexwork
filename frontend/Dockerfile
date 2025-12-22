# Use Node.js to build the Next.js app
FROM node:18 AS build

# Set working directory inside the container
WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the production version of the Next.js app
RUN yarn build

# Install only production dependencies
RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline

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

# Start the Next.js server
CMD ["yarn", "start"]
