FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the .env.local file to the container
#COPY .env.local .env.local

# Copy the rest of the application code
COPY . .

# Expose the port your application runs on
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]
