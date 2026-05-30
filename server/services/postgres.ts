import pg from 'pg'
import { PrismaClient } from '@prisma/client'

const { Pool } = pg
const prisma = new PrismaClient()

interface DatabaseSize {
  databaseName: string
  sizeMb: number
}

interface ConnectionStats {
  activeConnections: number
  idleConnections: number
  idleInTransaction: number
  maxConnections: number
  total: number
}

interface SlowQuery {
  queryId: number
  query: string
  calls: number
  meanTime: number
  totalTime: number
  rows: number
}

interface SchemaSize {
  schemaName: string
  sizeMb: number
}

interface HeavyTable {
  tableName: string
  schemaName: string
  sizeMb: number
  rowEstimate: number
}

interface CacheHitRatio {
  hitRatio: number
  hits: number
  reads: number
}

interface LockInfo {
  relation: string
  mode: string
  granted: boolean
  pid: number
  query: string
  age: string
}

interface PostgresAllMetrics {
  databaseName: string
  sizeMb: number
  activeConnections: number
  idleConnections: number
  maxConnections: number
  slowQueries: number
  cacheHitRatio: number
  locksCount: number
  heaviestTables: HeavyTable[]
}

export class PostgresService {
  private pool: pg.Pool

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      max: 1,
    })
  }

  async getDatabaseSize(): Promise<DatabaseSize | null> {
    try {
      const result = await this.pool.query(`
        SELECT datname AS "databaseName",
               ROUND(pg_database_size(datname) / 1024.0 / 1024.0, 2) AS "sizeMb"
        FROM pg_database
        WHERE datname = current_database()
      `)
      return result.rows[0] || null
    } catch (error) {
      console.error('[PostgresService] getDatabaseSize failed:', error)
      return null
    }
  }

  async getConnectionStats(): Promise<ConnectionStats | null> {
    try {
      const [activeResult, maxResult] = await Promise.all([
        this.pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE state = 'active') AS "activeConnections",
            COUNT(*) FILTER (WHERE state = 'idle') AS "idleConnections",
            COUNT(*) FILTER (WHERE state = 'idle in transaction') AS "idleInTransaction",
            COUNT(*) AS total
          FROM pg_stat_activity
          WHERE datname = current_database()
        `),
        this.pool.query('SHOW max_connections'),
      ])

      return {
        activeConnections: Number(activeResult.rows[0].activeConnections),
        idleConnections: Number(activeResult.rows[0].idleConnections),
        idleInTransaction: Number(activeResult.rows[0].idleInTransaction),
        maxConnections: Number(maxResult.rows[0].max_connections),
        total: Number(activeResult.rows[0].total),
      }
    } catch (error) {
      console.error('[PostgresService] getConnectionStats failed:', error)
      return null
    }
  }

  async getSlowQueries(limit = 10): Promise<SlowQuery[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          queryid AS "queryId",
          query,
          calls,
          ROUND(mean_exec_time::numeric, 2) AS "meanTime",
          ROUND(total_exec_time::numeric, 2) AS "totalTime",
          rows
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT $1
      `, [limit])
      return result.rows
    } catch {
      // pg_stat_statements may not be enabled
      return []
    }
  }

  async getSizeBySchema(): Promise<SchemaSize[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          schema_name AS "schemaName",
          ROUND(COALESCE(SUM(total_size) / 1024.0 / 1024.0, 0), 2) AS "sizeMb"
        FROM (
          SELECT
            schemaname AS schema_name,
            SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) AS total_size
          FROM pg_tables
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          GROUP BY schemaname
        ) sub
        GROUP BY schema_name
        ORDER BY "sizeMb" DESC
      `)
      return result.rows
    } catch (error) {
      console.error('[PostgresService] getSizeBySchema failed:', error)
      return []
    }
  }

  async getHeaviestTables(limit = 20): Promise<HeavyTable[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          relname AS "tableName",
          nspname AS "schemaName",
          ROUND(pg_total_relation_size(quote_ident(nspname) || '.' || quote_ident(relname)) / 1024.0 / 1024.0, 2) AS "sizeMb",
          reltuples::int AS "rowEstimate"
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE relkind = 'r'
          AND nspname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY pg_total_relation_size(quote_ident(nspname) || '.' || quote_ident(relname)) DESC
        LIMIT $1
      `, [limit])
      return result.rows
    } catch (error) {
      console.error('[PostgresService] getHeaviestTables failed:', error)
      return []
    }
  }

  async getCacheHitRatio(): Promise<CacheHitRatio | null> {
    try {
      const result = await this.pool.query(`
        SELECT
          ROUND(COALESCE(SUM(blks_hit)::numeric / NULLIF(SUM(blks_hit) + SUM(blks_read), 0) * 100, 0), 2) AS "hitRatio",
          SUM(blks_hit)::int AS hits,
          SUM(blks_read)::int AS reads
        FROM pg_stat_database
        WHERE datname = current_database()
      `)
      return result.rows[0] || null
    } catch (error) {
      console.error('[PostgresService] getCacheHitRatio failed:', error)
      return null
    }
  }

  async getLocks(): Promise<LockInfo[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          COALESCE(relation::regclass::text, '(unknown)') AS relation,
          mode,
          granted,
          pid,
          COALESCE(LEFT(query, 100), '') AS query,
          COALESCE(age(now(), query_start)::text, '') AS age
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND l.pid <> pg_backend_pid()
        ORDER BY age DESC
      `)
      return result.rows
    } catch (error) {
      console.error('[PostgresService] getLocks failed:', error)
      return []
    }
  }

  async getAllMetrics(): Promise<PostgresAllMetrics> {
    const defaultMetrics: PostgresAllMetrics = {
      databaseName: '',
      sizeMb: 0,
      activeConnections: 0,
      idleConnections: 0,
      maxConnections: 100,
      slowQueries: 0,
      cacheHitRatio: 0,
      locksCount: 0,
      heaviestTables: [],
    }

    try {
      const [dbSize, connStats, slowQueries, cacheHit, locks, heaviestTables] = await Promise.all([
        this.getDatabaseSize(),
        this.getConnectionStats(),
        this.getSlowQueries(5),
        this.getCacheHitRatio(),
        this.getLocks(),
        this.getHeaviestTables(10),
      ])

      return {
        databaseName: dbSize?.databaseName || process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
        sizeMb: dbSize?.sizeMb ?? 0,
        activeConnections: connStats?.activeConnections ?? 0,
        idleConnections: connStats?.idleConnections ?? 0,
        maxConnections: connStats?.maxConnections ?? 100,
        slowQueries: slowQueries.length,
        cacheHitRatio: cacheHit?.hitRatio ?? 0,
        locksCount: locks.length,
        heaviestTables,
      }
    } catch (error) {
      console.error('[PostgresService] getAllMetrics failed:', error)
      return defaultMetrics
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end()
  }
}
