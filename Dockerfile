FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json .
RUN npm install

# Copy all application files
COPY . .

# Build the application
RUN npm run build

# Expose the default Evershop port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]