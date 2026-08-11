import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, Search, UserPlus, Users } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { ApiRole, InviteUserRequest } from '@/types/api'
import { UserCard } from './UserCard'
import { UserDetail } from './UserDetail'
import { InvitePanel } from './InvitePanel'
import {
  fetchMembers,
  inviteMember,
  sortMembers,
  updateMember,
  type Member,
} from './users-data'

export default function UsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [inviting, setInviting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchMembers,
  })

  const members = useMemo(
    () => sortMembers(membersQuery.data ?? []),
    [membersQuery.data],
  )

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['users'] })

  const invite = useMutation({
    mutationFn: (request: InviteUserRequest) => inviteMember(request),
    onSuccess: invalidate,
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: ApiRole }) =>
      updateMember(id, { roleCode: role }),
    onSuccess: invalidate,
  })

  const toggleAccess = useMutation({
    mutationFn: (member: Member) =>
      updateMember(member.id, {
        status: member.status === 'disabled' ? 'ACTIVE' : 'DISABLED',
      }),
    onSuccess: invalidate,
  })

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? members.filter(
        (member) =>
          member.fullName.toLowerCase().includes(needle) ||
          member.email.toLowerCase().includes(needle),
      )
    : members

  const selected = members.find((member) => member.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Utilisateurs"
        description="Les personnes qui font partie de votre organisation."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="size-4" aria-hidden />
            Inviter un utilisateur
          </Button>
        }
      />

      {membersQuery.isPending ? (
        <LoadingList />
      ) : membersQuery.isError ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger les membres
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button size="lg" className="mt-6" onClick={() => membersQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={Users}
            title="Vous êtes seul pour le moment"
            description="Invitez les techniciens, agronomes et responsables de votre coopérative pour qu’ils puissent travailler avec vous en toute sécurité."
            action={
              <Button onClick={() => setInviting(true)}>
                <UserPlus className="size-4" aria-hidden />
                Inviter le premier membre
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <label className="mb-4 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-card">
            <Search className="size-4 shrink-0 text-ink-disabled" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Rechercher une personne"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-disabled"
            />
          </label>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface shadow-card">
              <EmptyState
                icon={Search}
                title="Personne à ce nom"
                description="Vérifiez l’orthographe ou effacez la recherche pour revoir toute la liste."
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Effacer la recherche
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((member, index) => (
                  <motion.li
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.24 }}
                  >
                    <UserCard
                      member={member}
                      index={index}
                      isSelf={member.id === user?.id}
                      isActive={member.id === selectedId}
                      onSelect={() => setSelectedId(member.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      <UserDetail
        member={selected}
        isSelf={selected?.id === user?.id}
        onClose={() => setSelectedId(null)}
        onChangeRole={async (id, role) => {
          await changeRole.mutateAsync({ id, role })
        }}
        onToggleAccess={async (member) => {
          await toggleAccess.mutateAsync(member)
        }}
      />

      <InvitePanel
        open={inviting}
        onClose={() => setInviting(false)}
        onInvite={async (request) => {
          await invite.mutateAsync(request)
        }}
      />
    </div>
  )
}

function LoadingList() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Chargement des membres…</span>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card"
        >
          <span className="size-11 shrink-0 animate-pulse rounded-full bg-canvas" />
          <span className="min-w-0 flex-1 space-y-2">
            <span
              className="block h-4 animate-pulse rounded bg-canvas"
              style={{ width: `${58 - (index % 3) * 10}%` }}
            />
            <span className="block h-3 w-40 animate-pulse rounded bg-canvas" />
          </span>
        </div>
      ))}
    </div>
  )
}

