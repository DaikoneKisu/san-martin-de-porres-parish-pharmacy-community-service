import { createApiClient } from "@sanmart/contracts";
import { PUBLIC_API_URL } from "$env/static/public";

export const api = createApiClient(PUBLIC_API_URL);
