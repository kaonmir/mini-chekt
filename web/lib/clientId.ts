/**
 * Generates and manages a unique client ID for this browser session
 * @returns A unique client ID string
 */
export function getClientId(): string {
  // Check if we already have a client ID in sessionStorage
  let clientId = sessionStorage.getItem('chekt_client_id');
  
  if (!clientId) {
    // Generate a new client ID if none exists
    clientId = crypto.randomUUID();
    sessionStorage.setItem('chekt_client_id', clientId);
  }
  
  return clientId;
}
