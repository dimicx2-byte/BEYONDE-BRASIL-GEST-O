// RBAC — papéis e alçadas do BEYOND OS
// deny = módulos bloqueados para o papel. Admin não bloqueia nada.
export const ROLES = {
  admin:     { label: 'Admin',                deny: [] },
  socio:     { label: 'Sócios',               deny: ['usuarios'] },
  diretoria: { label: 'Diretoria',            deny: ['usuarios', 'financeiro'] },
  dir_fin:   { label: 'Diretoria Financeira', deny: ['usuarios'] },
  equipe:    { label: 'Equipe Brasil',        deny: ['usuarios', 'financeiro'] },
};

export function canAccess(role, moduleId) {
  const r = ROLES[role] || ROLES.equipe;
  return !r.deny.includes(moduleId);
}

// Middleware: exige que o papel do usuário tenha acesso ao módulo.
export function requireModule(moduleId) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!canAccess(req.user.role, moduleId)) {
      return res.status(403).json({ error: 'Sem permissão para este módulo' });
    }
    next();
  };
}

// Alçadas de aprovação de contratos por valor (em R$).
export function contractApprovalChain(value) {
  if (value <= 250000) return [{ role: 'diretoria', label: 'Diretoria' }];
  if (value <= 1000000) return [
    { role: 'diretoria', label: 'Diretoria' },
    { role: 'dir_fin', label: 'Diretoria Financeira' },
  ];
  return [
    { role: 'dir_fin', label: 'Diretoria Financeira' },
    { role: 'socio', label: 'Sócios' },
    { role: 'admin', label: 'Admin' },
  ];
}

// Pode aprovar a etapa se for o papel exigido ou admin (override).
export function canApproveStep(role, step) {
  return role === step.role || role === 'admin';
}
