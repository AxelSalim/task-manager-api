'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  downloadUserDataCsv,
  downloadUserDataJsonPortable,
  householdAPI,
  userDataAPI,
  type AuditLogDto,
  type HouseholdMineDto,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Database, FileDown, FileJson, Home, Loader2, ScrollText } from 'lucide-react';

export function ProfileTrustSection() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [household, setHousehold] = useState<HouseholdMineDto | null>(null);
  const [householdLoading, setHouseholdLoading] = useState(true);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpires, setInviteExpires] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState<'csv' | 'json' | null>(null);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const rows = await userDataAPI.getAuditLogs(80);
      setAuditLogs(rows);
    } catch (e: unknown) {
      toast({
        title: 'Journal d’audit',
        description: e instanceof Error ? e.message : 'Chargement impossible',
        variant: 'destructive',
      });
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [toast]);

  const loadHousehold = useCallback(async () => {
    setHouseholdLoading(true);
    try {
      const h = await householdAPI.getMine();
      setHousehold(h);
    } catch {
      setHousehold(null);
    } finally {
      setHouseholdLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAudit();
    void loadHousehold();
  }, [loadAudit, loadHousehold]);

  const handleExport = async (kind: 'csv' | 'json') => {
    setExportBusy(kind);
    try {
      if (kind === 'csv') await downloadUserDataCsv();
      else await downloadUserDataJsonPortable();
      toast({ title: kind === 'csv' ? 'Export CSV téléchargé' : 'Export JSON téléchargé' });
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Export',
        variant: 'destructive',
      });
    } finally {
      setExportBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Mes données (export)
          </CardTitle>
          <CardDescription>
            Téléchargez une copie de vos données au format CSV ou JSON (portable) pour archivage ou
            transfert.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exportBusy !== null}
            onClick={() => void handleExport('csv')}
          >
            {exportBusy === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Télécharger CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exportBusy !== null}
            onClick={() => void handleExport('json')}
          >
            {exportBusy === 'json' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileJson className="h-4 w-4 mr-2" />
            )}
            Télécharger JSON
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Journal d’audit
          </CardTitle>
          <CardDescription>
            Dernières actions enregistrées sur votre compte (finances, foyer, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune entrée pour l’instant.</p>
          ) : (
            <div className="max-h-72 overflow-auto rounded-md border text-sm">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Action</th>
                    <th className="text-left p-2 font-medium">Cible</th>
                    <th className="text-left p-2 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-2 whitespace-nowrap text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-2">{row.action}</td>
                      <td className="p-2">
                        {row.entityType}
                        {row.entityId != null ? ` #${row.entityId}` : ''}
                      </td>
                      <td className="p-2 break-all max-w-[200px]">{row.details ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Foyer (partage optionnel)
          </CardTitle>
          <CardDescription>
            Un foyer permet de partager budgets et tâches (rôles owner / member). Vous ne pouvez
            appartenir qu’à un foyer à la fois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {householdLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : household ? (
            <div className="space-y-3">
              <p className="font-medium">{household.household.name}</p>
              <p className="text-sm text-muted-foreground">Votre rôle : {household.myRole}</p>
              <div>
                <p className="text-sm font-medium mb-1">Membres</p>
                <ul className="text-sm space-y-1">
                  {household.members.map((m) => (
                    <li key={m.userId}>
                      {m.name ?? m.email ?? `Utilisateur ${m.userId}`} — {m.role}
                    </li>
                  ))}
                </ul>
              </div>
              {household.myRole === 'owner' && (
                <div className="space-y-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setInviteCode(null);
                      setInviteExpires(null);
                      try {
                        const inv = await householdAPI.createInvite();
                        setInviteCode(inv.code);
                        setInviteExpires(inv.expiresAt);
                        toast({ title: 'Code d’invitation généré', description: 'Valide 7 jours.' });
                      } catch (e: unknown) {
                        toast({
                          title: 'Erreur',
                          description: e instanceof Error ? e.message : '',
                          variant: 'destructive',
                        });
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Générer un code d’invitation
                  </Button>
                  {inviteCode && (
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      Code : {inviteCode}
                      {inviteExpires && (
                        <span className="block text-xs text-muted-foreground font-sans mt-1">
                          Expire le {new Date(inviteExpires).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Créer un foyer</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Nom du foyer"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={busy || !newHouseholdName.trim()}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await householdAPI.create(newHouseholdName.trim());
                        setNewHouseholdName('');
                        toast({ title: 'Foyer créé' });
                        await loadHousehold();
                      } catch (e: unknown) {
                        toast({
                          title: 'Erreur',
                          description: e instanceof Error ? e.message : '',
                          variant: 'destructive',
                        });
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Créer
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rejoindre avec un code</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Code à 8 caractères"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || joinCode.trim().length < 4}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await householdAPI.join(joinCode.trim());
                        setJoinCode('');
                        toast({ title: 'Vous avez rejoint le foyer' });
                        await loadHousehold();
                      } catch (e: unknown) {
                        toast({
                          title: 'Erreur',
                          description: e instanceof Error ? e.message : '',
                          variant: 'destructive',
                        });
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Rejoindre
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
