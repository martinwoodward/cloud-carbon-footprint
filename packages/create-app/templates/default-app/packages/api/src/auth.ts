/*
 * © 2021 ThoughtWorks, Inc.
 */

import express from 'express'

import { Logger } from '@cloud-carbon-footprint/core'

const authLogger = new Logger('auth')

export default async function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> {
  try {
    authLogger.info('Authentication successful')
    next()
  } catch (e) {
    authLogger.error(`Authentication failed. Error: ${e.message}`, e)
    res.status(401).send('Unauthorized')
  }
}
