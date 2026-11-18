import { jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getGoogleConfigStatus } from "@/lib/google/config";

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    await requireAuthenticatedUser();
    const response = jsonSuccess({ configuration: getGoogleConfigStatus() }, { requestId });
    logRequest(request, { requestId, scope: "platform.config", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "platform.config", status: response.status });
    return response;
  }
}
