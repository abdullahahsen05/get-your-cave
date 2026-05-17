# Socket.IO VPS Notes

This app uses a custom Node server so Next.js and Socket.IO share the same HTTP port.

## Production start

- `pm2 start npm --name getyourcave -- start`
- `NEXT_PUBLIC_APP_URL` should point to the public origin, for example `https://your-domain.com`
- `DATABASE_URL` and `AUTH_SECRET` must be set in the VPS environment

## Nginx reverse proxy

Make sure websocket upgrade headers are forwarded:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## Socket.IO connection

- The client connects to the same domain and same port as the Next.js app
- Socket.IO uses `/socket.io` on the shared server
- Messages are always persisted to PostgreSQL before realtime events are emitted
