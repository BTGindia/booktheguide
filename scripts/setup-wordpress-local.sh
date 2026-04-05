#!/bin/bash
# Quick setup script for WordPress + Next.js development

set -e

echo "🚀 Starting Book The Guide setup..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker: https://docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker found"

# Start services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for WordPress to be ready
echo "⏳ Waiting for WordPress to be ready (30 seconds)..."
sleep 30

# Install WordPress
echo "🔧 Installing WordPress..."
docker-compose exec -T wordpress wp core install \
  --url="http://localhost:8000" \
  --title="Book The Guide" \
  --admin_user="admin" \
  --admin_password="TempPassword123!" \
  --admin_email="admin@booktheguide.local" \
  --skip-email 2>/dev/null || echo "⚠️  WordPress may already be installed"

# Install WPGraphQL
echo "📡 Installing WPGraphQL plugin..."
docker-compose exec -T wordpress wp plugin install wp-graphql --activate 2>/dev/null || echo "⚠️  WPGraphQL may already be installed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. WordPress Admin: http://localhost:8000/wp-admin"
echo "   Username: admin"
echo "   Password: TempPassword123!"
echo ""
echo "2. Configure .env.local with:"
echo "   WORDPRESS_GRAPHQL_URL=http://localhost:8000/graphql"
echo ""
echo "3. Start Next.js:"
echo "   npm run dev"
echo ""
echo "4. Visit: http://localhost:3000"
