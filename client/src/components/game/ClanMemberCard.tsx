import { useState } from 'react'
import { ClanMemberDetail } from 'shared'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

interface ClanMemberCardProps {
  member: ClanMemberDetail
  viewerRole: 'leader' | 'officer' | 'member' | undefined
  viewerPlayerGameId: number | null
  loading: boolean
  onPromote: (targetPlayerGameId: number) => void
  onDemote: (targetPlayerGameId: number) => void
  onKick: (targetPlayerGameId: number) => void
  onTransfer: (targetPlayerGameId: number) => void
}

function roleLabel(role: string): string {
  if (role === 'leader') return 'Leader'
  if (role === 'officer') return 'Officer'
  return 'Member'
}

export function ClanMemberCard({
  member, viewerRole, viewerPlayerGameId, loading,
  onPromote, onDemote, onKick, onTransfer,
}: ClanMemberCardProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  const isSelf = member.playerGameId === viewerPlayerGameId
  const isLeader = viewerRole === 'leader' && !isSelf
  const isOfficer = viewerRole === 'officer' && !isSelf

  function handleConfirm() {
    if (confirmAction === 'promote') onPromote(member.playerGameId)
    else if (confirmAction === 'demote') onDemote(member.playerGameId)
    else if (confirmAction === 'kick') onKick(member.playerGameId)
    else if (confirmAction === 'transfer') onTransfer(member.playerGameId)
    setConfirmAction(null)
  }

  return (
    <>
      <div className="clan-member-card">
        <div className="clan-member-header">
          <span className="clan-member-name">{member.username}</span>
          <span className={`clan-member-role role-${member.role}`}>{roleLabel(member.role)}</span>
        </div>

        <div className="clan-member-stats">
          <div className="stat-row">
            <span className="stat-label">Contributed Civilians</span>
            <span className="stat-value">{member.contributedCivilians}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">PvE Battles</span>
            <span className="stat-value">{member.pveBattlesAttended} ({member.pveDamageDealt} dmg, {member.pveSoldiersSpent} soldiers)</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Wars Participated</span>
            <span className="stat-value">{member.warsParticipated}</span>
          </div>
        </div>

        {(isLeader || isOfficer) && (
          <div className="clan-member-actions">
            {isLeader && member.role === 'member' && (
              <Button onClick={() => setConfirmAction('promote')} disabled={loading}>Promote</Button>
            )}
            {isLeader && member.role === 'officer' && (
              <Button onClick={() => setConfirmAction('demote')} disabled={loading}>Demote</Button>
            )}
            {isOfficer && member.role === 'member' && (
              <Button onClick={() => setConfirmAction('kick')} disabled={loading}>Kick</Button>
            )}
            {isLeader && (
              <Button onClick={() => setConfirmAction('kick')} disabled={loading}>Kick</Button>
            )}
            {isLeader && !isSelf && (
              <Button onClick={() => setConfirmAction('transfer')} disabled={loading}>Transfer</Button>
            )}
          </div>
        )}
      </div>

      {confirmAction && (
        <Modal open={true} title="Confirm Action" onClose={() => setConfirmAction(null)}>
          {confirmAction === 'promote' && <p>Promote {member.username} to Officer?</p>}
          {confirmAction === 'demote' && <p>Demote {member.username} to Member?</p>}
          {confirmAction === 'kick' && <p>Kick {member.username} from the clan?</p>}
          {confirmAction === 'transfer' && <p>Transfer clan ownership to {member.username}? You will become a regular member.</p>}
          <div className="modal-actions">
            <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </div>
        </Modal>
      )}
    </>
  )
}