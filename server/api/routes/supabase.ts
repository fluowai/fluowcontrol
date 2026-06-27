import { Router } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
import { SupabaseManagementService } from '../../services/supabase.js'
import crypto from 'crypto'

const router = Router()
const supabase = new SupabaseManagementService()

export function registerRoutes(app: import('express').Express) {

  // ─── List all Supabase projects ───────────────────────────────────────────
  router.get('/projects', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projects = await supabase.listProjects()
      return res.json(projects)
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar projetos Supabase', code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Get all projects with metrics ────────────────────────────────────────
  router.get('/projects/metrics', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const metrics = await supabase.getAllProjectsMetrics()
      return res.json(metrics)
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar métricas', code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Get single project ───────────────────────────────────────────────────
  router.get('/projects/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const project = await supabase.getProject(req.params.id)
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado', code: 'NOT_FOUND' })
      return res.json(project)
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Get project metrics ──────────────────────────────────────────────────
  router.get('/projects/:id/metrics', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const metrics = await supabase.getProjectMetrics(req.params.id)
      if (!metrics) return res.status(404).json({ error: 'Projeto não encontrado' })
      return res.json(metrics)
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Create new Supabase project ──────────────────────────────────────────
  router.post('/projects', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const { name, organizationId, plan, region, dbPass } = req.body

      if (!name) {
        return res.status(400).json({ error: 'name é obrigatório', code: 'MISSING_FIELDS' })
      }

      // Generate a secure password if not provided
      const password = dbPass || crypto.randomBytes(16).toString('hex')

      const project = await supabase.createProject({
        name,
        organizationId,
        plan: plan ?? 'free',
        region: region ?? 'sa-east-1',
        dbPass: password,
      })

      if (!project) {
        return res.status(500).json({
          error: 'Falha ao criar projeto. Verifique SUPABASE_MANAGEMENT_TOKEN e SUPABASE_ORG_ID.',
          code: 'SUPABASE_CREATE_FAILED'
        })
      }

      return res.status(201).json({ ...project, generatedDbPass: dbPass ? undefined : password })
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Pause project ────────────────────────────────────────────────────────
  router.post('/projects/:id/pause', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const ok = await supabase.pauseProject(req.params.id)
      return res.json({ success: ok })
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Restore project ──────────────────────────────────────────────────────
  router.post('/projects/:id/restore', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const ok = await supabase.restoreProject(req.params.id)
      return res.json({ success: ok })
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Delete project ───────────────────────────────────────────────────────
  router.delete('/projects/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const ok = await supabase.deleteProject(req.params.id)
      return res.json({ success: ok })
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Organization usage ───────────────────────────────────────────────────
  router.get('/usage', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const usage = await supabase.getOrgUsage()
      return res.json(usage ?? {})
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── List organizations ───────────────────────────────────────────────────
  router.get('/organizations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgs = await supabase.getOrganizations()
      return res.json(orgs)
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: 'SUPABASE_ERROR' })
    }
  })

  // ─── Check configuration status ───────────────────────────────────────────
  router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
    const hasToken = Boolean(process.env.SUPABASE_MANAGEMENT_TOKEN)
    const hasOrgId = Boolean(process.env.SUPABASE_ORG_ID)
    res.json({
      configured: hasToken && hasOrgId,
      hasManagementToken: hasToken,
      hasOrgId,
      message: !hasToken ? 'Configure SUPABASE_MANAGEMENT_TOKEN (app.supabase.com → Account → Access Tokens)'
        : !hasOrgId ? 'Configure SUPABASE_ORG_ID (ID da sua organização no Supabase)'
        : 'Supabase Management API configurada',
    })
  })

  app.use('/api/supabase', router)
}
