'use strict';

import Homey from 'homey/lib/Homey';
import https from 'https';
import { IncomingHttpHeaders } from 'http';

export interface MyZonneplanApp extends Homey.App {
startAuthorization: (
  email: string,
  sourceName: string,
) => Promise<{
  auth_session: string;
  otp_required: boolean;
  expires_in: number;
  codeVerifier: string;
}>;

  completeAuthorization: (
    authSession: string,
    otp: string,
  ) => Promise<{
    authorization_code: string;
  }>;

  exchangeAuthorizationCode: (
    code: string,
    codeVerifier: string,
  ) => Promise<any>;
}

export interface DeviceDefinition {
  name: string;
  data: {
    id: string;
    name: string;
  };
}

export interface HttpsPromiseOptions {
  body?: string | Buffer;
  hostname: string;
  path: string;
  method: string;
  headers?: { [key: string]: string | string[] | number };
  agent?: https.Agent;
  rejectUnauthorized?: boolean;
  family?: number;
  referrerPolicy?: string;
  credentials?: 'include' | 'omit' | 'same-origin';

  /**
   * HTTP status codes considered successful for this request.
   *
   * The Zonneplan OAuth challenge endpoint intentionally returns 403
   * when the email challenge is created.
   */
  expectedStatusCodes?: number[];
}

export interface HttpsPromiseResponse {
  body: string | object;
  headers: IncomingHttpHeaders;
}