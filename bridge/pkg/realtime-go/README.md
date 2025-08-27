# Realtime Go Client

A Go client for Supabase Realtime that supports both database events and broadcast events.

## Features

- Database table subscriptions (INSERT, UPDATE, DELETE events)
- Broadcast event subscriptions
- Automatic reconnection
- Heartbeat management
- User authentication support

## Installation

```bash
go get github.com/kaonmir/bridge/pkg/realtime-go
```

## Usage

### Database Events

Subscribe to database table changes:

```go
package main

import (
    "log"
    realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

func main() {
    // Create client
    client, err := realtimego.NewClient("https://your-project.supabase.co", "your-anon-key")
    if err != nil {
        log.Fatal(err)
    }

    // Connect
    err = client.Connect()
    if err != nil {
        log.Fatal(err)
    }
    defer client.Disconnect()

    // Subscribe to table changes
    channel, err := client.Channel(
        realtimego.WithTable(
            stringPtr("postgres"),  // database
            stringPtr("public"),    // schema
            stringPtr("messages"),  // table
        ),
    )
    if err != nil {
        log.Fatal(err)
    }

    // Set up event handlers
    channel.OnInsert = func(msg realtimego.Message) {
        log.Printf("INSERT: %+v", msg)
    }
    channel.OnUpdate = func(msg realtimego.Message) {
        log.Printf("UPDATE: %+v", msg)
    }
    channel.OnDelete = func(msg realtimego.Message) {
        log.Printf("DELETE: %+v", msg)
    }

    // Subscribe
    err = channel.Subscribe()
    if err != nil {
        log.Fatal(err)
    }

    // Keep connection alive
    select {}
}

func stringPtr(s string) *string {
    return &s
}
```

### Broadcast Events

Subscribe to broadcast events:

```go
package main

import (
    "log"
    realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

func main() {
    // Create client
    client, err := realtimego.NewClient("https://your-project.supabase.co", "your-anon-key")
    if err != nil {
        log.Fatal(err)
    }

    // Connect
    err = client.Connect()
    if err != nil {
        log.Fatal(err)
    }
    defer client.Disconnect()

    // Subscribe to broadcast channel
    broadcastChannel, err := client.Channel(
        realtimego.WithBroadcast("notifications"),
    )
    if err != nil {
        log.Fatal(err)
    }

    // Set up broadcast handler
    broadcastChannel.OnBroadcast = func(msg realtimego.Message) {
        log.Printf("Broadcast received: %+v", msg)

        // Handle different types of broadcast messages
        if payload, ok := msg.Payload.(map[string]interface{}); ok {
            if msgType, exists := payload["type"]; exists {
                switch msgType {
                case "notification":
                    log.Printf("Notification: %s", payload["message"])
                case "user_status":
                    log.Printf("User status: %s", payload["status"])
                }
            }
        }
    }

    // Subscribe
    err = broadcastChannel.Subscribe()
    if err != nil {
        log.Fatal(err)
    }

    // Keep connection alive
    select {}
}
```

### Multiple Channels

Subscribe to multiple channels simultaneously:

```go
// Database table subscription
dbChannel, err := client.Channel(
    realtimego.WithTable(stringPtr("postgres"), stringPtr("public"), stringPtr("users")),
)

// Broadcast subscription
broadcastChannel, err := client.Channel(
    realtimego.WithBroadcast("system-alerts"),
)

// Subscribe to both
dbChannel.Subscribe()
broadcastChannel.Subscribe()
```

### User Authentication

For RLS-protected tables, set the user token:

```go
client, err := realtimego.NewClient("https://your-project.supabase.co", "your-anon-key",
    realtimego.WithUserToken("user-jwt-token"),
)
```

## Broadcasting from Go Client

You can now send broadcast events directly from your Go client:

### Sending Broadcast Messages

```go
// Method 1: Send broadcast using client directly
err := client.SendBroadcast("notifications", "alert", map[string]interface{}{
    "type":    "system_alert",
    "message": "System maintenance in 5 minutes",
    "level":   "warning",
})
if err != nil {
    log.Printf("Failed to send broadcast: %v", err)
}

// Method 2: Create a broadcast channel and send messages
broadcastChannel, err := client.CreateBroadcastChannel("notifications")
if err != nil {
    log.Fatal(err)
}

// Send multiple messages through the same channel
err = broadcastChannel.SendBroadcast("user_joined", map[string]interface{}{
    "user_id": "123",
    "username": "john_doe",
})
if err != nil {
    log.Printf("Failed to send broadcast: %v", err)
}

err = broadcastChannel.SendBroadcast("game_update", map[string]interface{}{
    "game_id": "456",
    "score":   1500,
    "status":  "completed",
})
if err != nil {
    log.Printf("Failed to send broadcast: %v", err)
}
```

### Complete Example: Sender and Receiver

```go
package main

import (
    "log"
    "time"
    realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

func main() {
    // Create client
    client, err := realtimego.NewClient("https://your-project.supabase.co", "your-anon-key")
    if err != nil {
        log.Fatal(err)
    }

    // Connect
    err = client.Connect()
    if err != nil {
        log.Fatal(err)
    }
    defer client.Disconnect()

    // Subscribe to broadcast channel
    broadcastChannel, err := client.Channel(
        realtimego.WithBroadcast("notifications"),
    )
    if err != nil {
        log.Fatal(err)
    }

    // Set up broadcast handler
    broadcastChannel.OnBroadcast = func(msg realtimego.Message) {
        log.Printf("Broadcast received: %+v", msg)

        if payload, ok := msg.Payload.(map[string]interface{}); ok {
            if event, exists := payload["event"]; exists {
                log.Printf("Event: %s", event)
            }
            if data, exists := payload["payload"]; exists {
                log.Printf("Data: %+v", data)
            }
        }
    }

    // Subscribe
    err = broadcastChannel.Subscribe()
    if err != nil {
        log.Fatal(err)
    }

    // Send a broadcast message
    time.Sleep(2 * time.Second) // Wait for subscription to be ready

    err = client.SendBroadcast("notifications", "test_message", map[string]interface{}{
        "message": "Hello from Go client!",
        "timestamp": time.Now().Unix(),
    })
    if err != nil {
        log.Printf("Failed to send broadcast: %v", err)
    }

    // Keep connection alive
    select {}
}
```

## Broadcasting from Supabase

To send broadcast events from your Supabase project, you can use the `pg_notify` function in PostgreSQL functions or Edge Functions:

### PostgreSQL Function Example

```sql
-- Create a function to broadcast messages
CREATE OR REPLACE FUNCTION broadcast_message(channel_name text, message jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM pg_notify(
    'broadcast:' || channel_name,
    message::text
  );
END;
$$;

-- Usage
SELECT broadcast_message('notifications', '{"type": "alert", "message": "System maintenance in 5 minutes"}'::jsonb);
```

### Edge Function Example

```typescript
// supabase/functions/broadcast/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { channel, message } = await req.json();

  const { data, error } = await supabase.rpc("broadcast_message", {
    channel_name: channel,
    message: message,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Configuration Options

### Client Options

- `WithHeartbeatInterval(interval uint)` - Set heartbeat interval in seconds
- `WithUserToken(token string)` - Set user authentication token
- `WithParams(params map[string]interface{})` - Set custom parameters

### Channel Options

- `WithTable(database, schema, table *string)` - Subscribe to database table
- `WithBroadcast(channelName string)` - Subscribe to broadcast channel

## Error Handling

The client automatically handles reconnections and heartbeat management. However, you should implement proper error handling for your specific use case:

```go
channel.OnInsert = func(msg realtimego.Message) {
    // Handle database insert events
    log.Printf("New record inserted: %+v", msg.Payload)
}

channel.OnBroadcast = func(msg realtimego.Message) {
    // Handle broadcast events
    log.Printf("Broadcast received: %+v", msg.Payload)
}
```

## License

MIT
