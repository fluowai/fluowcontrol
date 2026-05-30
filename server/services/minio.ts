import { Client } from 'minio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BucketInfo {
  name: string
  created: Date
  size?: number
  objects?: number
}

interface UsageByClient {
  organizationId: string
  organizationName: string
  totalSizeMb: number
  totalObjects: number
  bucketCount: number
}

interface UsageByProduct {
  productId: string
  productName: string
  totalSizeMb: number
  totalObjects: number
  bucketCount: number
}

interface TotalUsage {
  totalSizeMb: number
  totalObjects: number
  bucketCount: number
}

interface DailyGrowth {
  date: string
  sizeMb: number
  objectsAdded: number
}

const EXPECTED_BUCKETS = [
  'whatsapp-media',
  'documents',
  'exports',
  'backups',
  'nexus-media',
  'gabinete-media',
]

export class MinioService {
  private client: Client

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      useSSL: process.env.MINIO_USE_SSL === 'true',
    })
  }

  async listBuckets(): Promise<BucketInfo[]> {
    try {
      const buckets = await this.client.listBuckets()
      const result: BucketInfo[] = []

      for (const bucket of buckets) {
        const info = await this.getBucketInfo(bucket.name)
        result.push({
          name: bucket.name,
          created: bucket.creationDate || new Date(),
          size: info.size,
          objects: info.objects,
        })
      }

      return result
    } catch (error) {
      console.error('[MinioService] listBuckets failed:', error)
      return []
    }
  }

  async getBucketSize(bucketName: string): Promise<{ sizeMb: number; objectCount: number }> {
    try {
      const info = await this.getBucketInfo(bucketName)
      return { sizeMb: info.size, objectCount: info.objects }
    } catch (error) {
      console.error(`[MinioService] getBucketSize(${bucketName}) failed:`, error)
      return { sizeMb: 0, objectCount: 0 }
    }
  }

  async getRecentFiles(bucketName: string, limit = 20): Promise<Array<{ name: string; size: number; lastModified: Date; etag: string }>> {
    try {
      const stream = this.client.listObjectsV2(bucketName, '', true)
      const objects: Array<{ name: string; size: number; lastModified: Date; etag: string }> = []

      for await (const obj of stream) {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
            etag: obj.etag || '',
          })
        }
      }

      objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      return objects.slice(0, limit)
    } catch (error) {
      console.error(`[MinioService] getRecentFiles(${bucketName}) failed:`, error)
      return []
    }
  }

  async getUsageByClient(): Promise<UsageByClient[]> {
    try {
      const buckets = await prisma.minioBucket.findMany({
        include: { organization: true },
        where: { organizationId: { not: null } },
      })

      const map = new Map<string, UsageByClient>()

      for (const bucket of buckets) {
        const orgId = bucket.organizationId!
        const existing = map.get(orgId) || {
          organizationId: orgId,
          organizationName: bucket.organization?.name || 'Unknown',
          totalSizeMb: 0,
          totalObjects: 0,
          bucketCount: 0,
        }
        existing.totalSizeMb += Number(bucket.sizeMb || 0)
        existing.totalObjects += bucket.totalObjects || 0
        existing.bucketCount++
        map.set(orgId, existing)
      }

      return Array.from(map.values())
    } catch (error) {
      console.error('[MinioService] getUsageByClient failed:', error)
      return []
    }
  }

  async getUsageByProduct(): Promise<UsageByProduct[]> {
    try {
      const buckets = await prisma.minioBucket.findMany({
        include: { product: true },
        where: { productId: { not: null } },
      })

      const map = new Map<string, UsageByProduct>()

      for (const bucket of buckets) {
        const productId = bucket.productId!
        const existing = map.get(productId) || {
          productId,
          productName: bucket.product?.name || 'Unknown',
          totalSizeMb: 0,
          totalObjects: 0,
          bucketCount: 0,
        }
        existing.totalSizeMb += Number(bucket.sizeMb || 0)
        existing.totalObjects += bucket.totalObjects || 0
        existing.bucketCount++
        map.set(productId, existing)
      }

      return Array.from(map.values())
    } catch (error) {
      console.error('[MinioService] getUsageByProduct failed:', error)
      return []
    }
  }

  async getTotalUsage(): Promise<TotalUsage> {
    try {
      const buckets = await prisma.minioBucket.findMany()
      const totalSizeMb = buckets.reduce((sum, b) => sum + Number(b.sizeMb || 0), 0)
      const totalObjects = buckets.reduce((sum, b) => sum + (b.totalObjects || 0), 0)

      return {
        totalSizeMb,
        totalObjects,
        bucketCount: buckets.length,
      }
    } catch (error) {
      console.error('[MinioService] getTotalUsage failed:', error)
      return { totalSizeMb: 0, totalObjects: 0, bucketCount: 0 }
    }
  }

  async getGrowthStats(days = 30): Promise<DailyGrowth[]> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const buckets = await prisma.minioBucket.findMany({
        where: { collectedAt: { gte: since } },
        orderBy: { collectedAt: 'asc' },
      })

      const dailyMap = new Map<string, { sizeMb: number; objectsAdded: number }>()

      for (const bucket of buckets) {
        const dateKey = bucket.collectedAt.toISOString().slice(0, 10)
        const existing = dailyMap.get(dateKey) || { sizeMb: 0, objectsAdded: 0 }
        existing.sizeMb += Number(bucket.sizeMb || 0)
        existing.objectsAdded += bucket.totalObjects || 0
        dailyMap.set(dateKey, existing)
      }

      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        sizeMb: data.sizeMb,
        objectsAdded: data.objectsAdded,
      }))
    } catch (error) {
      console.error('[MinioService] getGrowthStats failed:', error)
      return []
    }
  }

  private async getBucketInfo(bucketName: string): Promise<{ size: number; objects: number }> {
    let totalSize = 0
    let totalObjects = 0

    try {
      const stream = this.client.listObjectsV2(bucketName, '', true)
      for await (const obj of stream) {
        totalObjects++
        totalSize += obj.size || 0
      }
    } catch {
      // bucket may be empty or inaccessible
    }

    return { size: Math.round(totalSize / (1024 * 1024) * 100) / 100, objects: totalObjects }
  }
}
