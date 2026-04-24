import { mapApiEndpointToWebPath as mapSharedApiEndpointToWebPath } from '@aivora/shared';

export const mapApiEndpointToWebPath = (rawEndpoint, role) =>
  mapSharedApiEndpointToWebPath(rawEndpoint, role);
