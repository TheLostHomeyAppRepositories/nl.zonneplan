'use strict';

import { MyZonneplanApp } from './types/localTypes';

module.exports = {
  async postAuthorize({
    homey,
    body = {},
  }: {
    homey: any;
    body: any;
  }) {
    const app = <MyZonneplanApp>homey.app;

    return await app.startAuthorization(
      body.email,
      body.source_name,
    );
  },

  async postAuthorizeComplete({
    homey,
    body = {},
  }: {
    homey: any;
    body: any;
  }) {
    const app = <MyZonneplanApp>homey.app;

    return await app.completeAuthorization(
      body.auth_session,
      body.otp,
    );
  },

  async postToken({
    homey,
    body = {},
  }: {
    homey: any;
    body: any;
  }) {
    const app = <MyZonneplanApp>homey.app;

    return await app.exchangeAuthorizationCode(
      body.code,
      body.code_verifier,
    );
  },
};