# Simple Nginx Docker Compose

A simple nginx server setup using Docker Compose.

## Quick Start

1. **Start the container:**

   ```bash
   docker-compose up -d
   ```

2. **Access the server:**

   - Open your browser and go to `http://localhost`
   - Or use curl: `curl http://localhost`

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Configuration

### Files Structure

```
.
├── docker-compose.yml    # Docker Compose configuration
├── nginx.conf           # Nginx configuration
├── html/                # Static files directory
│   └── index.html       # Default page
└── logs/                # Nginx logs (created automatically)
```

### Ports

- **80**: HTTP traffic
- **443**: HTTPS traffic (ready for SSL configuration)

### Volumes

- `./nginx.conf` → `/etc/nginx/nginx.conf` (read-only)
- `./html` → `/usr/share/nginx/html` (read-only)
- `./logs` → `/var/log/nginx` (read-write)

## Customization

### Adding SSL/HTTPS

1. Place your SSL certificates in a `certs/` directory
2. Update the nginx.conf to include SSL configuration
3. Update docker-compose.yml to mount the certs directory

### Adding More Static Files

Simply place files in the `html/` directory and they will be served by nginx.

### Viewing Logs

```bash
# View access logs
docker-compose logs nginx

# Or check the mounted logs directory
tail -f logs/access.log
tail -f logs/error.log
```

## Troubleshooting

### Check if container is running

```bash
docker-compose ps
```

### View container logs

```bash
docker-compose logs nginx
```

### Restart the service

```bash
docker-compose restart nginx
```
