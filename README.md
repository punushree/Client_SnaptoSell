# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Environment Configuration

Copy the environment template file and configure your environment variables:

```bash
cp env.template .env
```

Required environment variables:

**Database Configuration (choose one):**
- `DATABASE_URL` - MySQL connection string (e.g., `mysql://user:password@host:port/database`)
- OR use individual parameters:
  - `DB_HOST` - Database host (default: localhost)
  - `DB_PORT` - Database port (default: 3306)
  - `DB_USER` - Database user
  - `DB_PASSWORD` - Database password
  - `DB_NAME` - Database name

**BetterAuth Configuration:**
- `BETTER_AUTH_SECRET` - Secret key for BetterAuth (minimum 32 characters, change in production!)
- `BETTER_AUTH_URL` - Base URL of your application (default: http://localhost:5173)

**Other Services:**
- `OPENAI_API_KEY` - Your OpenAI API key for product detection
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key for S3 uploads
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3 uploads
- `AWS_S3_BUCKET_NAME` - S3 bucket name for storing product images

### Database Setup

BetterAuth will automatically create and manage the required authentication tables (`user`, `session`, `account`, `verification`) when you first run the application. No manual migration is needed for these tables.

For other tables (like `product_detection`), use MikroORM migrations:

```bash
npm run migration:create
npm run migration:up
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

aws ecr get-login-password --region us-east-1 --profile snaptosell | docker login --username AWS --password-stdin 726591791633.dkr.ecr.us-east-1.amazonaws.com && docker buildx build --platform linux/amd64 --provenance=false -t snaptosell/dev:latest --load . && docker tag snaptosell/dev:latest 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest && docker push 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest

docker stop snaptosell-dev && docker rm snaptosell-dev && aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 726591791633.dkr.ecr.us-east-1.amazonaws.com && docker pull 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest && docker run -d -p 3000:3000 --restart always --name snaptosell-dev 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest

docker rm snaptosell-dev

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 726591791633.dkr.ecr.us-east-1.amazonaws.com

docker pull 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest

docker run -d -p 3000:3000 --restart always --name snaptosell-dev 726591791633.dkr.ecr.us-east-1.amazonaws.com/snaptosell/dev:latest
