# SERENO Deployment Guide

## Prerequisites

Before deploying SERENO, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Node.js** (version 18 or higher)
- **npm** (version 8 or higher)

## Quick Deployment

### 1. Environment Setup

Copy the environment example file and configure it:

```bash
cp .env.example .env.production
```

Edit `.env.production` and set the following required variables:

```env
# Database
DB_PASSWORD=your_secure_database_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Frontend URL
FRONTEND_URL=https://your-domain.com

# VAPID Keys (generate with: npm run generate:vapid)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your-email@domain.com

# External APIs (optional but recommended)
GOOGLE_SPEECH_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### 2. Generate VAPID Keys

Generate VAPID keys for push notifications:

```bash
npm run generate:vapid
```

Copy the generated keys to your `.env.production` file.

### 3. Deploy

Run the deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

The deployment script will:
- Check prerequisites
- Build the application
- Run database migrations
- Start Docker containers
- Perform health checks

### 4. Verify Deployment

After deployment, verify the application is running:

- **Frontend**: http://localhost (or your domain)
- **API**: http://localhost/api/v1
- **Health Check**: http://localhost/health

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Build Applications

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
cd ..
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### 4. Start Services

```bash
# Start with Docker Compose
docker-compose --env-file .env.production up -d
```

## Production Configuration

### SSL/HTTPS Setup

For production, you'll need SSL certificates. Update the `nginx.conf` file with your certificate paths:

```nginx
ssl_certificate /etc/nginx/ssl/your-cert.pem;
ssl_private_key /etc/nginx/ssl/your-key.pem;
```

### Environment Variables

Key production environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `FRONTEND_URL` | Frontend domain URL | Yes |
| `VAPID_PUBLIC_KEY` | Push notification public key | Yes |
| `VAPID_PRIVATE_KEY` | Push notification private key | Yes |
| `GOOGLE_SPEECH_API_KEY` | Google Speech API key | No |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | No |

### Security Considerations

1. **Change default passwords** in `.env.production`
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Configure firewall** to only allow necessary ports
5. **Regular security updates** for Docker images
6. **Monitor application logs** for security issues

## Monitoring and Maintenance

### Health Checks

The application provides several health check endpoints:

- `/health` - Basic health check
- `/health/detailed` - Detailed system information
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe

### Monitoring Dashboard

Access the monitoring dashboard (admin only):
- `/api/v1/monitoring/health` - System health
- `/api/v1/monitoring/performance` - Performance metrics
- `/api/v1/monitoring/errors` - Error tracking
- `/api/v1/monitoring/alerts` - System alerts

### Backup and Recovery

#### Database Backup

```bash
# Create backup
./scripts/deploy.sh backup

# Manual backup
docker-compose exec postgres pg_dump -U sereno_user sereno_db > backup.sql
```

#### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres psql -U sereno_user sereno_db < backup.sql
```

### Log Management

View application logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 443, 3001, 5432, 6379 are available
2. **Permission errors**: Check Docker permissions and file ownership
3. **Database connection**: Verify database credentials and network connectivity
4. **Memory issues**: Ensure sufficient RAM (minimum 2GB recommended)

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Rollback Deployment

If something goes wrong:

```bash
./scripts/deploy.sh rollback
```

## Scaling and Performance

### Horizontal Scaling

To scale the application:

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer
# Update nginx.conf to include multiple backend instances
```

### Performance Optimization

1. **Enable Redis caching** for frequently accessed data
2. **Configure CDN** for static assets
3. **Database indexing** for better query performance
4. **Connection pooling** for database connections

## Support

For deployment issues:

1. Check the logs: `docker-compose logs`
2. Verify health endpoints: `curl http://localhost/health`
3. Review configuration files
4. Check system resources (CPU, memory, disk)

## Security Updates

Regular maintenance tasks:

1. **Update Docker images** monthly
2. **Update Node.js dependencies** regularly
3. **Monitor security advisories**
4. **Review access logs** for suspicious activity
5. **Backup database** before updates