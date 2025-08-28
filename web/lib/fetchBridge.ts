import { createClient } from "./supabase/client";
import type { Database } from "./supabase/types";
import { getClientId } from "./clientId";
import { listenForRequestResponse } from "./hooks/use-realtime-responses";

interface FetchBridgeParams {
  bridgeId: number;
  path: string;
  body?: Record<string, unknown>;
}

interface FetchBridgeResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface BridgeResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Fetches data from a bridge using Supabase Realtime broadcast for requests
 * and Postgres Changes for listening to responses
 * @param bridgeId - The ID of the bridge to send the request to
 * @param path - The API path to request
 * @param body - Optional request body
 * @returns Promise that resolves with the response data when completed
 */
export async function fetchBridge({
  bridgeId,
  path,
  body,
}: FetchBridgeParams): Promise<FetchBridgeResult> {
  const supabase = createClient();

  try {
    // Generate unique request ID
    const requestId = crypto.randomUUID();

    // Create channel name for this bridge
    const channelName = `bridge-${bridgeId}`;

    // Subscribe to the channel to listen for response using the new system
    const responsePromise = listenForRequestResponse(requestId);

    // Get client ID for this session
    const requesterId = getClientId();

    // Subscribe to bridge channel and send request
    const channel = supabase.channel(channelName);

    return new Promise((resolve) => {
      channel
        .on("broadcast", { event: "request" }, () => {
          // This is just to confirm we're connected to the bridge channel
          console.log("Connected to bridge channel");
        })
        .subscribe((bridgeStatus) => {
          if (bridgeStatus === "SUBSCRIBED") {
            console.log(
              `Subscribed to channel ${channelName} for request ${requestId}`
            );

            // Send the request via broadcast
            channel.send({
              type: "broadcast",
              event: path,
              payload: {
                request_id: requestId,
                path,
                body,
                requester_id: requesterId,
              },
            });

            // Wait for response using the new system
            responsePromise
              .then((responseRecord) => {
                console.log(
                  `Received response for request ${requestId}:`,
                  responseRecord
                );

                // Unsubscribe from bridge channel
                supabase.removeChannel(channel);

                const responseData =
                  responseRecord.response_body as unknown as BridgeResponse;

                if (responseData?.success) {
                  resolve({
                    success: true,
                    data: responseData.data,
                  });
                } else {
                  resolve({
                    success: false,
                    error: responseData?.error || "Request failed",
                  });
                }
              })
              .catch((error) => {
                console.error(
                  `Error waiting for response ${requestId}:`,
                  error
                );

                // Unsubscribe from bridge channel
                supabase.removeChannel(channel);

                resolve({
                  success: false,
                  error: `Request failed: ${error}`,
                });
              });
          } else if (bridgeStatus === "CHANNEL_ERROR") {
            console.error(`Failed to subscribe to channel ${channelName}`);
            resolve({
              success: false,
              error: "Failed to subscribe to bridge channel",
            });
          }
        });
    });
  } catch (error) {
    console.error("Error in fetchBridge:", error);
    return {
      success: false,
      error: `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Type-safe version using Database types
export type ResponseRecord = Database["public"]["Tables"]["response"]["Row"];
