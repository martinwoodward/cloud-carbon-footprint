/*
 * © 2021 ThoughtWorks, Inc.
 */

import {
  ICloudService,
  Region,
  ComputeEstimator,
  StorageEstimator,
  NetworkingEstimator,
  MemoryEstimator,
  CLOUD_CONSTANTS,
  BillingExportTable,
  ComputeEngine,
} from '@cloud-carbon-footprint/core'
import { configLoader } from '@cloud-carbon-footprint/common'
import CloudProviderAccount from './CloudProviderAccount'
import { EstimationResult } from '@cloud-carbon-footprint/common'
import { v3 } from '@google-cloud/monitoring'
import { ClientOptions } from 'google-gax'
import { BigQuery } from '@google-cloud/bigquery'

export default class GCPAccount extends CloudProviderAccount {
  constructor(
    public projectId: string,
    public name: string,
    private regions: string[],
  ) {
    super()
  }

  getDataForRegions(
    startDate: Date,
    endDate: Date,
  ): Promise<EstimationResult[]>[] {
    return this.regions.map((regionId) => {
      return this.getDataForRegion(regionId, startDate, endDate)
    })
  }

  getDataForRegion(
    regionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EstimationResult[]> {
    const gcpServices = this.getServices()
    const region = new Region(regionId, gcpServices, configLoader().GCP.NAME)
    return this.getRegionData(region, startDate, endDate)
  }

  getDataFromBillingExportTable(startDate: Date, endDate: Date) {
    const billingExportTableService = new BillingExportTable(
      new ComputeEstimator(),
      new StorageEstimator(CLOUD_CONSTANTS.GCP.SSDCOEFFICIENT),
      new StorageEstimator(CLOUD_CONSTANTS.GCP.HDDCOEFFICIENT),
      new NetworkingEstimator(),
      new MemoryEstimator(CLOUD_CONSTANTS.GCP.MEMORY_COEFFICIENT),
      new BigQuery({ projectId: this.projectId }),
    )
    return billingExportTableService.getEstimates(startDate, endDate)
  }

  getServices(): ICloudService[] {
    return configLoader().GCP.CURRENT_SERVICES.map(({ key }) => {
      return this.getService(key)
    })
  }

  private getService(key: string): ICloudService {
    if (this.services[key] === undefined)
      throw new Error('Unsupported service: ' + key)
    const options: ClientOptions = {
      projectId: this.projectId,
    }
    return this.services[key](options)
  }

  private services: {
    [id: string]: (options: ClientOptions) => ICloudService
  } = {
    computeEngine: (options) => {
      return new ComputeEngine(new v3.MetricServiceClient(options))
    },
  }
}
