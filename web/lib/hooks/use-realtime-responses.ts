import { createClient } from "../supabase/client";
import type { Database } from "../supabase/types";

type ResponseRecord = Database["public"]["Tables"]["response"]["Row"];

/**
 * Listens for a specific request response using Supabase Realtime
 * @param requestId - The unique request ID to listen for
 * @returns Promise that resolves with the response record when received
 */
export function listenForRequestResponse(requestId: string): Promise<ResponseRecord> {
  const supabase = createClient();

  return new Promise((resolve, reject) => {
    // Create a channel for listening to responses
    const channel = supabase.channel(`response-${requestId}`);

    // Set up a timeout to reject the promise if no response is received
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      reject(new Error(`Timeout waiting for response to request ${requestId}`));
    }, 30000); // 30 second timeout

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "response",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          console.log(`Received response for request ${requestId}:`, payload);
          
          // Clear the timeout
          clearTimeout(timeout);
          
          // Remove the channel
          supabase.removeChannel(channel);
          
          // Resolve with the response record
          resolve(payload.new as ResponseRecord);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Listening for response to request ${requestId}`);
        } else if (status === "CHANNEL_ERROR") {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          reject(new Error(`Failed to subscribe to response channel for request ${requestId}`));
        }
      });
  });
}
